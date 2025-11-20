import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  Logger, // Import Logger
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProposalDto, VoteProposalDto, UpdateProposalStatusDto } from './proposal.dto';

@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name); // Initialize Logger

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // CREATE PROPOSAL
  // ---------------------------------------------------------
  async create(userId: number, dto: CreateProposalDto) {
    try {
      // ... existing logic ...
      const membership = await this.prisma.roomMember.findUnique({
        where: {
          roomId_userId: { roomId: dto.roomId, userId },
        },
      });

      if (!membership) {
        throw new ForbiddenException('You must be a member of the room to submit a proposal.');
      }

      return await this.prisma.proposal.create({
        data: {
          roomId: dto.roomId,
          proposerId: userId,
          placeId: dto.placeId,
          proposedName: dto.proposedName,
          proposedAddress: dto.proposedAddress,
          proposedLatitude: dto.proposedLatitude,
          proposedLongitude: dto.proposedLongitude,
          proposedDateStart: dto.proposedDateStart,
          proposedDateEnd: dto.proposedDateEnd,
          details: dto.details,
          status: 'OPEN',
        },
      });
    } catch (error) {
      this.logger.error(`Create Proposal failed for user ${userId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to create proposal: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // GET PROPOSALS (By Room)
  // ---------------------------------------------------------
  async findAllByRoom(userId: number, roomId: number) {
    try {
      const membership = await this.prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId, userId } },
      });
      if (!membership) throw new ForbiddenException('Access denied.');

      return await this.prisma.proposal.findMany({
        where: { roomId },
        include: {
          proposer: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          place: true,
          responses: {
            include: {
              user: {
                 select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
            }
          },
          _count: {
            select: { responses: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Find Proposals failed for room ${roomId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to fetch proposals: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // VOTE (Respond)
  // ---------------------------------------------------------
  async vote(userId: number, proposalId: number, dto: VoteProposalDto) {
    try {
      const proposal = await this.prisma.proposal.findUnique({
        where: { id: proposalId },
      });

      if (!proposal) throw new NotFoundException('Proposal not found');
      if (proposal.status !== 'OPEN') {
        throw new BadRequestException('Voting is closed for this proposal.');
      }

      const membership = await this.prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: proposal.roomId, userId } },
      });
      if (!membership) throw new ForbiddenException('You are not in this room.');

      return await this.prisma.proposalResponse.upsert({
        where: {
          proposalId_userId: { proposalId, userId },
        },
        update: {
          response: dto.response,
          comment: dto.comment,
          respondedAt: new Date(),
        },
        create: {
          proposalId,
          userId,
          response: dto.response,
          comment: dto.comment,
          respondedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Vote failed for proposal ${proposalId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to submit vote: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // CLOSE / UPDATE STATUS
  // ---------------------------------------------------------
  async updateStatus(userId: number, proposalId: number, dto: UpdateProposalStatusDto) {
    try {
      const proposal = await this.prisma.proposal.findUnique({
        where: { id: proposalId },
        include: { room: { include: { members: true } } },
      });

      if (!proposal) throw new NotFoundException('Proposal not found');

      const isProposer = proposal.proposerId === userId;
      const memberRecord = proposal.room.members.find(m => m.userId === userId);
      const isOwner = memberRecord?.role === 'OWNER';

      if (!isProposer && !isOwner) {
        throw new ForbiddenException('Only the proposer or room owner can close this proposal.');
      }

      return await this.prisma.proposal.update({
        where: { id: proposalId },
        data: {
          status: dto.status,
          closedAt: dto.status !== 'OPEN' ? new Date() : null,
        },
      });
    } catch (error) {
      this.logger.error(`Update Status failed for proposal ${proposalId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to update proposal status: ${error.message}`);
    }
  }
}