// src/auth/api/auth.controller.ts

import { Body, Controller, Post, UseGuards, Get, Res, HttpCode } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { AuthService } from "../service/auth.service";
import { JwtAuthGuard } from "../service/jwt.guard";
import { CurrentUser } from "../service/current-user.decorator";
import { AccessTokenClaims } from "../service/jwt-payload";
import { CookieService } from "../service/cookie.service";
import { Response } from "express";
import { ApiResponse } from "@nestjs/swagger";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.login({
      username: dto.username,
      password: dto.password,
    });
    this.cookieService.setAuthCookies(res, { accessToken, refreshToken });
    return { user, accessToken, refreshToken };
  }
  @Post('register')
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 409, description: 'Username or Phone already exists.' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("refresh")
  async refresh(@Body() dto: RefreshDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.refresh(dto.refreshToken);
    this.cookieService.setAuthCookies(res, { accessToken, refreshToken });
    return { user, accessToken, refreshToken };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: AccessTokenClaims) {
    return user;
  }
  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    this.cookieService.clearAuthCookies(res);
    return { success: true };
  }
}
