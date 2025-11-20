import { IsString, IsNotEmpty, MinLength, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    example: "cool_user_123",
    description: "Unique username",
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: "StrongPass!123",
    description: "User password (min 6 chars)",
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: "John Doe",
    description: "Display name",
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    example: "+1234567890",
    description: "Phone number",
  })
  @IsOptional()
  @IsString()
  phone?: string;
}