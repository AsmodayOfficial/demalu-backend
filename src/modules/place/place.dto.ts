import { 
  IsString, IsOptional, IsNumber, IsUrl, IsArray, IsNotEmpty 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlaceDto {
  @ApiProperty({ example: "Central Park", description: "Name of the place" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "A large public park in NYC" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Park", description: "Category tag" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: "Google Maps Place ID for sync" })
  @IsOptional()
  @IsString()
  googlePlaceId?: string;

  @ApiPropertyOptional({ example: "https://example.com/image.jpg" })
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiPropertyOptional({ type: [String], description: "List of image URLs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: "New York, NY" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 40.785091 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -73.968285 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class UpdatePlaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class SearchNearbyDto {
  @ApiProperty({ example: 40.785091 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -73.968285 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 5, description: "Radius in Kilometers (default 5)" })
  @IsOptional()
  @IsNumber()
  radius?: number;
}