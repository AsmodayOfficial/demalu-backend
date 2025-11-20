// src/auth/service/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AccessTokenClaims } from "./jwt-payload";

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AccessTokenClaims => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as AccessTokenClaims;
});
