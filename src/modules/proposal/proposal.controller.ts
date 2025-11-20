import { 
  Controller, Post, Get, Body, Param, Request, Patch, ParseIntPipe, 
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProposalService } from './proposal.service';
import { CreateProposalDto, VoteProposalDto, UpdateProposalStatusDto } from './proposal.dto';
import { JwtAuthGuard } from '../auth/service/jwt.guard';

@ApiTags('Proposals')
@Controller('proposals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new proposal in a room' })
  async create(@Request() req, @Body() dto: CreateProposalDto) {
    const userId = req.user?.id;
    return this.proposalService.create(userId, dto);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'List all proposals for a specific room' })
  async findAllByRoom(
    @Request() req, 
    @Param('roomId', ParseIntPipe) roomId: number
  ) {
    const userId = req.user?.id;
    return this.proposalService.findAllByRoom(userId, roomId);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote (Accept/Reject) on a proposal' })
  async vote(
    @Request() req,
    @Param('id', ParseIntPipe) proposalId: number,
    @Body() dto: VoteProposalDto
  ) {
    const userId = req.user?.id;
    return this.proposalService.vote(userId, proposalId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Close or Cancel a proposal (Proposer/Owner only)' })
  async updateStatus(
    @Request() req,
    @Param('id', ParseIntPipe) proposalId: number,
    @Body() dto: UpdateProposalStatusDto
  ) {
    const userId = req.user?.id;
    return this.proposalService.updateStatus(userId, proposalId, dto);
  }
}