import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "+77079876543",
    description: "User phone number in KZ format",
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: "Tech@tech",
    description: "User password",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
