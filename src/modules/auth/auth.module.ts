import { Module } from "@nestjs/common";
import { AuthService } from "./service/auth.service";
import { AuthController } from "./api/auth.controller";
import { PrismaService } from "src/database/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from "./service/jwt.strategy";
import { CookieService } from "./service/cookie.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtService, JwtStrategy, CookieService],
})
export class AuthModule {}
