import { 
  Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, 
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlaceService } from './place.service';
import { CreatePlaceDto, UpdatePlaceDto, SearchNearbyDto } from './place.dto';
import { JwtAuthGuard } from '../auth/service/jwt.guard';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Places')
@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new place' })
  @ApiResponse({ status: 201, description: 'Place created successfully.' })
  create(@Body() createPlaceDto: CreatePlaceDto) {
    return this.placeService.create(createPlaceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all places (with optional text search)' })
  @ApiQuery({ name: 'query', required: false, description: 'Search by name, desc, or address' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  findAll(
    @Query('query') query?: string,
    @Query('category') category?: string,
  ) {
    return this.placeService.findAll(query, category);
  }

  @Post('nearby')
  @ApiOperation({ summary: 'Find places near a specific location' })
  @ApiResponse({ status: 200, description: 'List of nearby places sorted by distance' })
  findNearby(@Body() dto: SearchNearbyDto) {
    return this.placeService.findNearby(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific place' })
  @ApiResponse({ status: 404, description: 'Place not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.placeService.findOne(id);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a place' })
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updatePlaceDto: UpdatePlaceDto
  ) {
    return this.placeService.update(id, updatePlaceDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a place' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.placeService.remove(id);
  }
}