import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService (unit)', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwtMock = {
    signAsync: jest.fn(),
  } as unknown as JwtService;

  const configMock = {
    get: jest.fn((key: string) => {
      if (key === 'WEB_URL') return 'http://localhost:3000';
      return undefined;
    }),
    getOrThrow: jest.fn(() => 'jwt-secret'),
  } as unknown as ConfigService;

  const mailMock = {
    sendVerificationEmail: jest.fn(),
  } as unknown as MailService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('signup', () => {
    it('normalize email, hashes password, creates. user + empty profile', async () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-01T00:00:00.000Z');

      (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('HASHED');

      (prismaMock.user.create as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.de',
        createdAt,
        updatedAt,
      });
      (jwtMock.signAsync as unknown as jest.Mock).mockResolvedValue('TOKEN');
      (mailMock.sendVerificationEmail as unknown as jest.Mock).mockResolvedValue(
        { messageId: 'm1' },
      );

      const res = await service.signup(' A@B.DE', 'pw');

      expect(bcrypt.hash).toHaveBeenCalledWith('pw', 12);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'a@b.de',
          passwordHash: 'HASHED',
          emailVerifiedAt: null,
          profile: { create: {} },
        },
        select: { id: true, email: true, createdAt: true, updatedAt: true },
      });

      expect(res).toEqual({
        id: 'u1',
        email: 'a@b.de',
        createdAt,
        updatedAt,
      });
    });
  });

  describe('login', () => {
    it('validates credentials, updates lastActiveAt, returns token', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-02T12:00:00.00Z'));

      (prismaMock.user.findUnique as unknown as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.de',
        passwordHash: 'HASHED',
        role: 'USER',
        isBanned: false,
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      (bcrypt.compare as unknown as jest.Mock).mockResolvedValue(true);

      (jwtMock.signAsync as unknown as jest.Mock).mockResolvedValue('TOKEN');

      const res = await service.login('A@B.DE', 'pw');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@b.de' },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          isBanned: true,
          emailVerifiedAt: true,
        },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('pw', 'HASHED');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { lastActiveAt: new Date('2026-01-02T12:00:00.000Z') },
      });

      expect(jwtMock.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b.de',
        role: 'USER',
      });

      expect(res).toEqual({ access_token: 'TOKEN' });

      jest.useRealTimers();
    });

    it('throws UnauthorizedException when user not found', async () => {
      (prismaMock.user.findUnique as unknown as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.login('a@b.de', 'pw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      (prismaMock.user.findUnique as unknown as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.de',
        passwordHash: 'HASHED',
        role: 'USER',
        isBanned: false,
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as any);

      await expect(service.login('a@b.de', 'wrong')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });
  });
});
