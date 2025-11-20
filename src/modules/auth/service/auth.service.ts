import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  HttpException,
  Logger, // Import Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../database/prisma.service'; 
import { RegisterDto } from '../api/dto/register.dto';
import { LoginDto } from '../api/dto/login.dto';

// ... existing types ...
export type PublicUser = {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  roomPin: string;
  pv: number; 
  sv: number; 
};

export type AccessTokenClaims = PublicUser & {
  sub: number;
};

export type RefreshTokenClaims = {
  sub: number;
  jti: string; 
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name); // Initialize Logger

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ... existing helpers (buildPublicUser, signTokens) ...
  private buildPublicUser(user: any): PublicUser {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? null,
      avatarUrl: user.avatarUrl ?? null,
      roomPin: '', 
      pv: 1,
      sv: 1,
    };
  }

  private async signTokens(user: PublicUser) {
    const payload: AccessTokenClaims = {
      sub: user.id,
      ...user,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h',
      }),
      this.jwt.signAsync(
        { sub: user.id, jti: crypto.randomUUID() } as RefreshTokenClaims,
        {
          secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
          expiresIn: '30d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    try {
      // ... existing logic ...
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }

      if (dto.phone) {
        const existingPhone = await this.prisma.user.findUnique({
          where: { phone: dto.phone },
        });
        if (existingPhone) {
          throw new ConflictException('Phone number already registered');
        }
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);

      const newUser = await this.prisma.user.create({
        data: {
          username: dto.username,
          passwordHash: passwordHash,
          displayName: dto.displayName,
          phone: dto.phone,
        },
      });

      const publicUser = this.buildPublicUser(newUser);
      const tokens = await this.signTokens(publicUser);

      return {
        user: publicUser,
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`Register failed for ${dto.username}`, error.stack); // Log Error
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Registration failed: ${error.message}`);
    }
  }

  async login(dto: LoginDto) {
    try {
      // ... existing logic ...
      const { username, password } = dto;
      console.log("dto", dto)

      const user = await this.prisma.user.findUnique({
        where: { username },
      });

      if (!user || !user.passwordHash) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordOk = await bcrypt.compare(password, user.passwordHash);
      if (!passwordOk) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const publicUser = this.buildPublicUser(user);
      const tokens = await this.signTokens(publicUser);

      return {
        user: publicUser,
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`Login failed for ${dto.username}`, error.stack); // Log Error
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Login failed: ${error.message}`);
    }
  }

  async refresh(refreshToken: string) {
    try {
      if (!refreshToken) throw new BadRequestException('Refresh token required');

      let payload: RefreshTokenClaims;
      try {
        payload = await this.jwt.verifyAsync<RefreshTokenClaims>(refreshToken, {
          secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        });
      } catch (e) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) throw new UnauthorizedException('User not found');

      const publicUser = this.buildPublicUser(user);
      const tokens = await this.signTokens(publicUser);

      return { user: publicUser, ...tokens };
    } catch (error) {
      this.logger.error(`Refresh token failed`, error.stack); // Log Error
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Refresh failed: ${error.message}`);
    }
  }
}