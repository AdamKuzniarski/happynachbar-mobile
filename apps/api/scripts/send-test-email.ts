import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { MailService } from 'src/mail/mail.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const mail = app.get(MailService, { strict: false });

  await mail.sendVerificationEmail(
    'test@example.com',
    'http://localhost:3000/auth/verify?token=dev',
  );

  await app.close();
}

void main();
