import { IsString, IsOptional, IsInt, IsNotEmpty, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// --- COUNTRY DTOs ---

export class CreateCountryDto {
  @ApiProperty({ example: "France", description: "Name of the country" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 1, description: "Rank in top list" })
  @IsOptional()
  @IsInt()
  @Min(1)
  rank?: number;

  @ApiPropertyOptional({ example: "FR", description: "ISO 3166-1 alpha-2 code" })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  isoCode?: string;
}

export class UpdateCountryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  rank?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 2)
  isoCode?: string;
}

// --- CITY DTOs ---

export class CreateCityDto {
  @ApiProperty({ example: "Paris", description: "Name of the city" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, description: "ID of the country this city belongs to" })
  @IsInt()
  @IsNotEmpty()
  countryId: number;
}

export class UpdateCityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}