import { Module } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { WeatherProposalService } from './gemini.service';

@Module({
  controllers: [ProposalController],
  providers: [ProposalService,WeatherProposalService, PrismaService, JwtService],
  exports: [ProposalService, WeatherProposalService]
})
export class ProposalModule {}
