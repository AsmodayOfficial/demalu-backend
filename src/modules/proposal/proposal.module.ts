import { Module } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [ProposalController],
  providers: [ProposalService, PrismaService, JwtService],
  exports: [ProposalService]
})
export class ProposalModule {}
