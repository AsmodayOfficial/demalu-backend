import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RefreshDto {
  @ApiProperty({
    description: "Refresh token issued during login or token renewal",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString({ message: "refreshToken must be a string" })
  @IsNotEmpty({ message: "refreshToken should not be empty" })
  refreshToken: string;
}
