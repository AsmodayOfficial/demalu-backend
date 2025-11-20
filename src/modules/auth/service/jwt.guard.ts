import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify the token using the same secret as AuthService
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // 💡 Attach the payload to the request object
      // This makes 'req.user' available in Controllers
      request['user'] = payload;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

private extractTokenFromHeader(request: Request): string | undefined {
    // 1. Try to extract from cookies
    // Note: Cast to 'any' or extend the Request interface if TypeScript complains about .cookies
    let token = (request as any).cookies?.accessToken;

    // 2. If not in cookies, check the Authorization header
    if (!token) {
      const [type, auth] = request.headers.authorization?.split(' ') ?? [];
      token = type === 'Bearer' ? auth : undefined;
    }

    return token;
  }
}