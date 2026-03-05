import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (unit)', () => {
  let controller: AuthController;

  const authServiceMock = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST /auth/signup delegates to AuthService.signup', async () => {
    authServiceMock.signup.mockResolvedValue({ id: 'u1' });

    const res = await controller.signup({ email: 'A@B.DE', password: 'pw' });

    expect(authServiceMock.signup).toHaveBeenCalledWith(
      'A@B.DE',
      'pw',
      undefined,
    );
    expect(res).toEqual({ id: 'u1' });
  });

  it('POST /auth/login delegates to AuthService.login', async () => {
    authServiceMock.login.mockResolvedValue({ access_token: 'TOKEN' });

    const res = await controller.login({ email: 'a@b.de', password: 'pw' });

    expect(authServiceMock.login).toHaveBeenCalledWith('a@b.de', 'pw');
    expect(res).toEqual({ access_token: 'TOKEN' });
  });

  it('GET /auth/me returns req.user (guard is tested elsewhere)', () => {
    const req = { user: { userId: 'u1', email: 'a@b.de' } };
    expect(controller.me(req)).toEqual(req.user);
  });
});
