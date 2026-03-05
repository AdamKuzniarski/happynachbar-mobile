import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import type { StringValue } from 'ms';

import { Prisma } from '@prisma/client';

import * as crypto from 'crypto';


type VerifyEmailPayload = {
  sub: string;
  purpose: 'verify-email';
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  private normalizeEmail(email: string) {
    return email.toLowerCase().trim();
  }

  private getEmailTokenSecret() {
    return (
      this.config.get<string>('EMAIL_TOKEN_SECRET') ??
      this.config.getOrThrow<string>('JWT_SECRET')
    );
  }

  private getEmailTokenExpiresIn(): StringValue {
    return this.config.get<StringValue>('EMAIL_TOKEN_EXPIRES_IN') ?? '24h';
  }

  private async signEmailVerificationToken(userId: string) {
    const payload: VerifyEmailPayload = {
      sub: userId,
      purpose: 'verify-email',
    };

    return this.jwt.signAsync(payload, {
      secret: this.getEmailTokenSecret(),
      expiresIn: this.getEmailTokenExpiresIn(),
    });
  }

  private getPasswordResetTtlMinutes(): number {
    const raw = this.config.get<string>('PASSWORD_RESET_TTL_MINUTES');
    const parsed = raw != null ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async signup(email: string, password: string, displayName?: string) {
    const passwordHash = await bcrypt.hash(password, 12);
    const dn = displayName?.trim() ? displayName.trim() : undefined;

    try {
      const user = await this.prisma.user.create({
        data: {
          email: this.normalizeEmail(email),
          passwordHash,
          emailVerifiedAt: null,
          profile: { create: dn ? { displayName: dn } : {} },
        },
        select: { id: true, email: true, createdAt: true, updatedAt: true },
      });

      const token = await this.signEmailVerificationToken(user.id);

      const webUrl =
        this.config.get<string>('WEB_URL') ?? 'http://localhost:3000';
      const verifyLink = `${webUrl}/de/auth/verify?token=${encodeURIComponent(token)}`;

      try {
        await this.mail.sendVerificationEmail(user.email, verifyLink);
      } catch {
        await this.prisma.user.delete({ where: { id: user.id } });
        throw new InternalServerErrorException(
          'Could not send verification email',
        );
      }

      return user;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  async verifyEmail(token: string) {
    let payload: VerifyEmailPayload;

    try {
      payload = await this.jwt.verifyAsync<VerifyEmailPayload>(token, {
        secret: this.getEmailTokenSecret(),
      });
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }

    if (!payload?.sub || payload.purpose !== 'verify-email') {
      throw new BadRequestException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, emailVerifiedAt: true },
    });

    if (!user) throw new BadRequestException('Invalid token');

    if (user.emailVerifiedAt) {
      return { verified: true };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    return { verified: true };
  }
  async resendVerificationEmail(email: string) {
    const normalized = this.normalizeEmail(email);

    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, emailVerifiedAt: true },
    });

    if (!user) return { ok: true };

    if (user.emailVerifiedAt) return { ok: true };

    const token = await this.signEmailVerificationToken(user.id);
    const webUrl =
      this.config.get<string>('WEB_URL') ?? 'http://localhost:3000';
    const verifyLink = `${webUrl}/de/auth/verify?token=${encodeURIComponent(token)}`;

    await this.mail.sendVerificationEmail(user.email, verifyLink);
    return { ok: true };
  }

  private async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isBanned: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.isBanned) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email not verified');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = await this.jwt.signAsync(payload);

    return { access_token };
  }

  async requestPasswordReset(email: string) {
    const normalized = this.normalizeEmail(email);

    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, isBanned: true, emailVerifiedAt: true },
    });

    if (!user) return { ok: true };
    if (user.isBanned) return { ok: true };

    if (!user.emailVerifiedAt) {
      try {
        await this.resendVerificationEmail(user.email);
      } catch {}
      return { ok: true };
    }

    const rawToken = this.generateResetToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + this.getPasswordResetTtlMinutes() * 60_000,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const webUrl =
      this.config.get<string>('WEB_URL') ?? 'http://localhost:3000';
    const resetLink = `${webUrl}/de/auth/reset?token=${encodeURIComponent(rawToken)}`;

    try {
      await this.mail.sendPasswordResetEmail(user.email, resetLink);
    } catch {
      await this.prisma.user
        .update({
          where: { id: user.id },
          data: { passwordResetTokenHash: null, passwordResetExpiresAt: null },
        })
        .catch(() => {});
    }

    return { ok: true };
  }

  async resetPassword(rawToken: string, newPassword) {
    const trimmedToken = rawToken?.trim();
    if (!trimmedToken)
      throw new BadRequestException('Invalid or expired token');

    const tokenHash = this.hashToken(trimmedToken);
    const now = new Date();
    const resetCandidate = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: now },
        isBanned: false,
        emailVerifiedAt: { not: null },
      },
      select: { id: true },
    });

    if (!resetCandidate) {
      throw new BadRequestException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const result = await this.prisma.user.updateMany({
      where: {
        id: resetCandidate.id,
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
        isBanned: false,
        emailVerifiedAt: { not: null },
      },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        lastActiveAt: now,
      },
    });

    if (result.count !== 1) {
      throw new BadRequestException('Invalid or expired token');
    }

    return { ok: true };
  }
}
