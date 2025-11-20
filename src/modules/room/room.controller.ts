import { Controller, Post, Body, Get, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto, JoinRoomDto } from './create-room.dto';
import { JwtAuthGuard } from '../auth/service/jwt.guard';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Ensure you have this guard created

@ApiTags('Rooms')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room (Auto-generates PIN)' })
  @ApiResponse({ status: 201, description: 'Room created successfully.' })
  @ApiResponse({ status: 409, description: 'User already in a room.' })
  @ApiResponse({ status: 400, description: 'Location required if maxDistance is set.' })
  async create(@Request() req, @Body() dto: CreateRoomDto) {
    // Assuming JwtAuthGuard populates req.user
    const userId = req.user?.id; 
    return this.roomService.createRoom(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all public rooms' })
  @ApiResponse({ status: 200, description: 'List of public rooms with member counts.' })
  async findAll() {
    return this.roomService.getPublicRooms();
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a room by PIN' })
  @ApiResponse({ status: 201, description: 'Joined successfully.' })
  @ApiResponse({ status: 404, description: 'Invalid PIN.' })
  @ApiResponse({ status: 403, description: 'Room full or user too far away (Geofence).' })
  @ApiResponse({ status: 409, description: 'User already in a room.' })
  async join(@Request() req, @Body() dto: JoinRoomDto) {
    const userId = req.user?.id;
    return this.roomService.joinRoomByPin(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get details of the room the current user is in' })
  @ApiResponse({ status: 200, description: 'Current room details or null.' })
  async getMyRoom(@Request() req) {
    const userId = req.user?.id;
    return this.roomService.getMyRoom(userId);
  }

  @Delete('leave')
  @ApiOperation({ summary: 'Leave the current room' })
  @ApiResponse({ status: 200, description: 'Left room successfully.' })
  @ApiResponse({ status: 404, description: 'User is not in a room.' })
  async leave(@Request() req) {
    const userId = req.user?.id;
    return this.roomService.leaveRoom(userId);
  }
}