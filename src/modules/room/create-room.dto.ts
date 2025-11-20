import { IsString, IsOptional, IsBoolean, IsInt, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: "Weekend Hike", description: "Name of the room" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: false, description: "If true, room might be hidden from public lists (though PIN access is universal here)" })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: "Maximum number of members allowed" })
  @IsOptional()
  @IsInt()
  @Min(2)
  maxMembers?: number;

  @ApiPropertyOptional({ description: "Geofence radius in Kilometers" })
  @IsOptional()
  @IsInt()
  maxDistance?: number;

  @ApiPropertyOptional({ description: "Latitude of the gathering point" })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: "Longitude of the gathering point" })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class JoinRoomDto {
  @ApiProperty({ example: "123456", description: "The unique PIN of the room to join" })
  @IsString()
  pin: string;
}