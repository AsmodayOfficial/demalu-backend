import { IsNumber, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserLocationDto {
  @ApiProperty({ example: 40.7128, description: "Latitude (-90 to 90)" })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -74.0060, description: "Longitude (-180 to 180)" })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 10, description: "GPS accuracy in meters" })
  @IsOptional()
  @IsInt()
  @Min(0)
  accuracy?: number;
}