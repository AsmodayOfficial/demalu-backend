import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response } from "express";
import { CookieService } from "./cookie.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}
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

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    let access = req.cookies?.accessToken;
    if (!access) {
      const hdr = req.headers.authorization;
      if (hdr?.startsWith("Bearer ")) access = hdr.slice(7);
    }
    if (!access) throw new UnauthorizedException("Token not provided");

    try {
      const payload = this.jwtService.verify(access, {
        secret: process.env.JWT_SECRET,
      });
      (req as any).user = {
        id: payload.sub,
        role: payload.role,
        permissions: payload.permissions,
        companyWide: payload.companyWide,
        companyIds: payload.companyIds,
        objectIds: payload.objectIds,
        projectIds: payload.projectIds,
        warehouseIds: payload.warehouseIds,
        sid: payload.sid,
        pv: payload.pv,
        sv: payload.sv,
      };
      return true;
    } catch (e) {
      const refresh = req.cookies?.refreshToken;
      if (!refresh) throw new UnauthorizedException("Invalid or expired access token");
      this.clearAuthCookies(res);
      this.logger.error(e);

      try {
        const r = this.jwtService.verify(refresh, {
          secret: process.env.JWT_REFRESH_SECRET,
        });
        const newAccess = this.jwtService.sign(
          {
            sub: r.sub,
            role: r.role,
            permissions: r.permissions,
            companyWide: r.companyWide,
            companyIds: r.companyIds,
            objectIds: r.objectIds,
            projectIds: r.projectIds,
            warehouseIds: r.warehouseIds,
            sid: r.sid,
            pv: r.pv,
            sv: r.sv,
          },
          { secret: process.env.JWT_SECRET, expiresIn: "15m" },
        );
        res.cookie("accessToken", newAccess, {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
          maxAge: 15 * 60 * 1000,
        });

        const p2 = this.jwtService.verify(newAccess, {
          secret: process.env.JWT_SECRET,
        });
        (req as any).user = {
          id: p2.sub,
          role: p2.role,
          permissions: p2.permissions,
          companyWide: p2.companyWide,
          companyIds: p2.companyIds,
          objectIds: p2.objectIds,
          projectIds: p2.projectIds,
          warehouseIds: p2.warehouseIds,
          sid: p2.sid,
          pv: p2.pv,
          sv: p2.sv,
        };
        return true;
      } catch {
        this.clearAuthCookies(res);
        throw new UnauthorizedException("Invalid or expired token");
      }
    }
  }
}
