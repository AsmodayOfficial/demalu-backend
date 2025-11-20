// src/auth/service/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../database/prisma.service'; // Adjust path as needed
import { LoginDto } from '../api/dto/login.dto';
import { AccessTokenClaims, PublicUser, RefreshTokenClaims } from './jwt-payload';
import { RegisterDto } from '../api/dto/register.dto';

// ---- Types & Interfaces ----


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ---------- Helpers ----------

  private async findUserByUsername(username: string) {
    // Assuming your Prisma schema has a 'username' or 'phone' field unique constraint
    return this.prisma.user.findFirst({
      where: { username }, // Or { phone: username } depending on your DB schema
    });
  }

  private buildPublicUser(user: any): PublicUser {
    return {
      id: user.id,
      username: user.username,
      // Ensure your DB has a roomPin field, or provide a fallback
      roomPin: user.roomPin || '', 
      
      // Hardcoded or mapped from DB if these versions exist in your schema
      pv: user.pv ?? 1,
      sv: user.sv ?? 1,
    };
  }

  private async signTokens(user: PublicUser) {
    const payload: AccessTokenClaims = {
      sub: user.id,
      ...user,
    };

    const [accessToken, refreshToken] = await Promise.all([
      // Access Token
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h',
      }),
      // Refresh Token
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

  // ---------- Public Methods ----------

  async login(dto: LoginDto) {
    const { username, password } = dto;

    // 1. Find User
    const user = await this.findUserByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash); // Assuming field is 'password' or 'passwordHash'
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Check active status (optional based on your schema)
    // if (!user.isActive) throw new UnauthorizedException('User is inactive');

    // 4. Generate Tokens
    const publicUser = this.buildPublicUser(user);
    const tokens = await this.signTokens(publicUser);

    return {
      user: publicUser,
      ...tokens,
    };
  }

  async register(dto: RegisterDto) {
    // 1. Check if Username exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // 2. Check if Phone exists (only if phone is provided)
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 4. Create User
    const newUser = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash: passwordHash,
        displayName: dto.displayName,
        phone: dto.phone,
      },
    });

    // 5. Sign Tokens & Return
    const publicUser = this.buildPublicUser(newUser);
    const tokens = await this.signTokens(publicUser);

    return {
      user: publicUser,
      ...tokens,
    };
  }


  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token required');
    }

    try {
      // 1. Verify Token
      const payload = await this.jwt.verifyAsync<RefreshTokenClaims>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        },
      );

      // 2. Find User from Payload
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // 3. Generate New Tokens
      const publicUser = this.buildPublicUser(user);
      const tokens = await this.signTokens(publicUser);

      return {
        user: publicUser,
        ...tokens,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}