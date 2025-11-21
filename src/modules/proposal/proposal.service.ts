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
import { CreateProposalDto, VoteProposalDto, UpdateProposalStatusDto, ProposalRequestDto } from './proposal.dto';
import { Prisma, Proposal } from '@prisma/client';
import { WeatherProposalService } from './gemini.service';

@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name); // Initialize Logger

  constructor(private readonly prisma: PrismaService, private readonly weatherProposalService: WeatherProposalService ) {}

  // ---------------------------------------------------------
  // CREATE PROPOSAL
  // ---------------------------------------------------------
  async create(userId: number, dto: CreateProposalDto): Promise<Proposal> {
    try {
      // 1. Проверка членства (Existing Logic)
      const membership = await this.prisma.roomMember.findUnique({
        where: {
          roomId_userId: { roomId: dto.roomId, userId },
        },
      });
      if (!membership) {
        throw new ForbiddenException('You must be a member of the room to submit a proposal.');
      }

      // 2. Получение количества участников комнаты для Gemini
      // Предполагается, что модель Room имеет отношение 'members' для RoomMember.
      const room = await this.prisma.room.findUnique({
        where: { id: dto.roomId },
        select: {
            members: {
                select: { userId: true } // Fetch members only to count them
            }
        },
      });
      
      if (!room) {
          throw new InternalServerErrorException(`Room with ID ${dto.roomId} not found.`);
      }
      const roomCountMembers = room.members.length;

      // 3. Подготовка DTO для Gemini и вызов сервиса
      const proposalRequest: ProposalRequestDto = {
        roomCountMembers: roomCountMembers,
        proposedName: dto.proposedName,
        proposedAddress: dto.proposedAddress,
        proposedDateStart: dto.proposedDateStart, 
        proposedDateEnd: dto.proposedDateEnd,
      };

      this.logger.log(`Calling Gemini prediction for proposal: ${dto.proposedName}`);
      
      const predictionResult = await this.weatherProposalService.getProposalPrediction(proposalRequest);
      
      this.logger.log(`Gemini prediction received. Lat: ${predictionResult.lat}, Long: ${predictionResult.long}`);

      // 4. Сохранение предложения, включая результаты Gemini
      return await this.prisma.proposal.create({
        data: {
          roomId: dto.roomId,
          proposerId: userId,
          proposedName: dto.proposedName,
          proposedAddress: dto.proposedAddress,
          proposedLatitude: new Prisma.Decimal(predictionResult.lat), 
          proposedLongitude: new Prisma.Decimal(predictionResult.long),
                    whether: predictionResult.whether,
          prediction: predictionResult.prediction, // Содержит текст на русском и оценку Grade A-F

          proposedDateStart: new Date(dto.proposedDateStart), // Конвертируем обратно в Date для Prisma
          proposedDateEnd: new Date(dto.proposedDateEnd),     // Конвертируем обратно в Date для Prisma
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
  async findAllProposalsForUserRooms(userId: number) {
    try {
      // 1. Get all room IDs the user belongs to
      const memberships = await this.prisma.roomMember.findMany({
        where: { userId },
        select: { roomId: true },
      });

      const roomIds = memberships.map(m => m.roomId);

      if (roomIds.length === 0) {
        return []; // User is not in any rooms, return empty array
      }

      // 2. Find all proposals where roomId is one of the user's rooms, including minimal response data
      const proposalsWithResponses = await this.prisma.proposal.findMany({
        where: {
          roomId: { in: roomIds },
        },
        include: {
          proposer: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          place: true,
          // Fetch only the response type for aggregation
          responses: {
            select: {
              response: true,
            }
          },
          // Removed _count selection
        },
        orderBy: { createdAt: 'desc' },
      });

      // 3. Map the results to include calculated counts and exclude the raw responses array
      return proposalsWithResponses.map(proposal => {
        const acceptCount = proposal.responses.filter(r => r.response === 'ACCEPT').length;
        const rejectCount = proposal.responses.filter(r => r.response === 'REJECT').length;
        
        // Destructure to exclude the 'responses' array from the final output
        const { responses, ...restOfProposal } = proposal;

        return {
          ...restOfProposal,
          acceptCount,
          rejectCount,
        };
      });

    } catch (error) {
      this.logger.error(`Find Proposals for user ${userId}'s rooms failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to fetch proposals for user's rooms: ${error.message}`);
    }
  }
  // ---------------------------------------------------------
  // VOTE (Respond)
  // ---------------------------------------------------------
  async vote(userId: number, proposalId: number, dto: VoteProposalDto) {
    try {
      console.log("dto", dto)
      console.log("userId", userId)
            console.log("proposalId", proposalId)

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