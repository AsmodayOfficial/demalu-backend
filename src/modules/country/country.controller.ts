import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegionService } from './country.service';
import { CreateCountryDto, UpdateCountryDto, CreateCityDto, UpdateCityDto } from './country.dto';
import { JwtAuthGuard } from '../auth/service/jwt.guard';

@ApiTags('Regions (Countries & Cities)')
@Controller()
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  // ==================================================================
  // COUNTRIES
  // ==================================================================

  @Post('countries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new country' })
  @ApiResponse({ status: 201, description: 'Country created.' })
  createCountry(@Body() dto: CreateCountryDto) {
    return this.regionService.createCountry(dto);
  }

  @Get('countries')
  @ApiOperation({ summary: 'List all countries ordered by rank' })
  findAllCountries() {
    return this.regionService.findAllCountries();
  }

  @Get('countries/:id')
  @ApiOperation({ summary: 'Get a country and its cities' })
  findOneCountry(@Param('id', ParseIntPipe) id: number) {
    return this.regionService.findOneCountry(id);
  }

  @Patch('countries/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a country' })
  updateCountry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCountryDto,
  ) {
    return this.regionService.updateCountry(id, dto);
  }

  @Delete('countries/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a country' })
  removeCountry(@Param('id', ParseIntPipe) id: number) {
    return this.regionService.removeCountry(id);
  }

  // ==================================================================
  // CITIES
  // ==================================================================

  @Post('cities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a city to a country' })
  createCity(@Body() dto: CreateCityDto) {
    return this.regionService.createCity(dto);
  }

  @Get('countries/:id/cities')
  @ApiOperation({ summary: 'Get all cities for a specific country' })
  findCitiesByCountry(@Param('id', ParseIntPipe) countryId: number) {
    return this.regionService.findAllCitiesByCountry(countryId);
  }

  @Patch('cities/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a city name' })
  updateCity(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCityDto,
  ) {
    return this.regionService.updateCity(id, dto);
  }

  @Delete('cities/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a city' })
  removeCity(@Param('id', ParseIntPipe) id: number) {
    return this.regionService.removeCity(id);
  }
}