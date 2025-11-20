export type PublicUser = {
  id: number;
  username: string;
  roomPin: string;
  pv: number; // permission version
  sv: number; // scope version
};

export type AccessTokenClaims = PublicUser & {
  sub: number;
};

export type RefreshTokenClaims = {
  sub: number;
  jti: string; // Unique identifier for the token
};
