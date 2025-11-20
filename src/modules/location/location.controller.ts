import { Controller, Post, Get, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/service/jwt.guard';
import { UserLocationService } from './location.service';
import { CreateUserLocationDto } from './location.dto';

@ApiTags('User Locations')
@Controller('locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserLocationController {
  constructor(private readonly locationService: UserLocationService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new user location' })
  @ApiResponse({ status: 201, description: 'Location recorded and set as current.' })
  async create(@Request() req, @Body() dto: CreateUserLocationDto) {
    const userId = req.user?.id;
    return this.locationService.create(userId, dto);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get the users current active location' })
  async getCurrent(@Request() req) {
    const userId = req.user?.id;
    return this.locationService.getCurrentLocation(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get location history (last 50 points)' })
  async getHistory(@Request() req) {
    const userId = req.user?.id;
    return this.locationService.getLocationHistory(userId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all location history for the user' })
  async deleteHistory(@Request() req) {
    const userId = req.user?.id;
    return this.locationService.deleteHistory(userId);
  }
}