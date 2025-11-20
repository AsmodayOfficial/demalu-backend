import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "user1",
    description: "User phone number in KZ format",
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: "password123",
    description: "User password",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
