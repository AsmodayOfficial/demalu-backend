import { 
  IsString, IsOptional, IsInt, IsNumber, IsEnum, IsDateString, IsNotEmpty 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProposalResponseType, ProposalStatus } from '@prisma/client';

export class CreateProposalDto {
  @ApiProperty({ description: "ID of the room this proposal belongs to" })
  @IsInt()
  @IsNotEmpty()
  roomId: number;

  // Option A: Pick an existing Place
  @ApiPropertyOptional({ description: "ID of an existing Place (optional)" })
  @IsOptional()
  @IsInt()
  placeId?: number;

  // Option B: Custom Location
  @ApiPropertyOptional({ description: "Name of custom location" })
  @IsOptional()
  @IsString()
  proposedName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proposedAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  proposedLatitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  proposedLongitude?: number;

  // Dates
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  proposedDateStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  proposedDateEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  details?: string;
}

export class VoteProposalDto {
  @ApiProperty({ enum: ProposalResponseType, description: "ACCEPT or REJECT" })
  @IsEnum(ProposalResponseType)
  response: ProposalResponseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateProposalStatusDto {
  @ApiProperty({ enum: ProposalStatus, description: "CLOSED or CANCELLED" })
  @IsEnum(ProposalStatus)
  status: ProposalStatus;
}