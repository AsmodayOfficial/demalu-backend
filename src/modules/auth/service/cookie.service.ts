// src/auth/service/cookie.service.ts
import { Injectable } from "@nestjs/common";
import { Response } from "express";

@Injectable()
export class CookieService {
  static ACCESS_TOKEN_NAME = "accessToken";
  static REFRESH_TOKEN_NAME = "refreshToken";

  setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const commonOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    };

    res.cookie(CookieService.ACCESS_TOKEN_NAME, tokens.accessToken, {
      ...commonOptions,
      // maxAge: 60 * 1000, // 1 min
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie(CookieService.REFRESH_TOKEN_NAME, tokens.refreshToken, {
      ...commonOptions,
      // maxAge: 60 * 1000, // 1 min
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie(CookieService.ACCESS_TOKEN_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.clearCookie(CookieService.REFRESH_TOKEN_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
}
