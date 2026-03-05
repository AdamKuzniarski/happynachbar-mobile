import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

type RequestUser = { role?: UserRole };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    //kein @Roles() => offen

    if (requredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const role = req.user?.role;

    if (!role) throw new ForbiddenException('Missing role');
    if (requredRoles.includes(role)) return true;

    throw new ForbiddenException('Insufficient role');
  }
}
