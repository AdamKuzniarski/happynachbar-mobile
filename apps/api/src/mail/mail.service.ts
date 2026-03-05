import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;
  private verified = false;

  constructor(private readonly config: ConfigService) {}

  private env(key: string, fallback?: string): string | undefined {
    const v = this.config.get<string>(key) ?? process.env[key] ?? fallback;
    return v === '' ? fallback : v;
  }

  private boolEnv(key: string, fallback = false): boolean {
    const v = this.env(key);
    if (v == null) return fallback;
    return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const host = this.env('SMTP_HOST');
    if (!host) {
      throw new Error('SMTP_HOST is not set');
    }

    const port = Number(this.env('SMTP_PORT', '587'));
    const user = this.env('SMTP_USER');
    const pass = this.env('SMTP_PASS');

    const secure = port === 465;
    const rejectUnauthorized = this.boolEnv('SMTP_TLS_REJECT_UNAUTH', true);

    const tlsServername = this.env('SMTP_TLS_SERVERNAME', host);

    const requireTLS = this.boolEnv('SMTP_REQUIRE_TLS', port === 587);

    this.logger.log(
      `SMTP host=${host} port=${port} secure=${secure} user=${user ? 'set' : 'none'} tlsServername=${tlsServername} rejectUnauthorized=${rejectUnauthorized}`,
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      requireTLS,
      tls: {
        rejectUnauthorized,
        servername: tlsServername,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });

    return this.transporter;
  }

  private async verifyOnce() {
    if (this.verified) return;
    const t = this.getTransporter();

    try {
      await t.verify();
      this.verified = true;
      this.logger.log('SMTP transporter verified ');
    } catch (e: any) {
      this.logger.warn(`SMTP verify failed (continuing): ${e?.message ?? e}`);
    }
  }

  async sendVerificationEmail(to: string, link: string) {
    const from = this.env('MAIL_FROM', 'noreply@happynachbar.local');
    if (!from) throw new Error('MAIL_FROM is not set');

    const subject = 'Bitte bestätige deine E-Mail-Adresse';

    try {
      await this.verifyOnce();
      const transporter = this.getTransporter();

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: `Bitte bestätige deine E-Mail:\n${link}`,
        html: `<p>Bitte bestätige deine E-Mail:</p>
               <p><a href="${link}">E-Mail bestätigen</a></p>
               <p><small>${link}</small></p>`,
      });

      this.logger.log(
        `Verification email sent to=${to} messageId=${info.messageId}`,
      );
      return info;
    } catch (e: any) {
      this.logger.error(
        `sendVerificationEmail failed to=${to}`,
        e?.stack ?? String(e),
      );
      throw e;
    }
  }

  async sendPasswordResetEmail(to: string, link: string) {
    const from = this.env('MAIL_FROM', 'noreply@happynachbar.local');
    if (!from) throw new Error('MAIL_FROM is not set');

    const subject = 'Password zurücksetzen';

    try {
      await this.verifyOnce();
      const transporter = this.getTransporter();

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: `Du hast ein neues Passwort angefordert.\n\nLink zum Zurücksetzen:\n${link}\n\nWenn du das nicht warst, ignoriere diese Mail.`,
        html: `<p>Du hast ein neues Passwort angefordert.</p>
               <p><a href="${link}">Passwort zurücksetzen</a></p>
               <p><small>${link}</small></p>
               <p><small>Wenn du das nicht warst, ignoriere diese Mail.</small></p>`,
      });

      this.logger.log(
        `Password reset email sent to=${to} messageId=${info.messageId}`,
      );
      return info;
    } catch (e: any) {
      this.logger.error(
        `sendPasswordResetEmail failed to=${to}`,
        e?.stack ?? String(e),
      );
      throw e;
    }
  }
}
