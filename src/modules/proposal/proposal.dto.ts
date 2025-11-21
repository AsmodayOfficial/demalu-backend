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
  @ApiProperty()
  @IsDateString()
  proposedDateStart?: string;

  @ApiProperty()
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
// Input DTO for the proposal prediction request
export class ProposalRequestDto {
  @IsInt()
  @IsNotEmpty()
  roomCountMembers: number; // Corresponds to room.CountMembers

  @IsString()
  @IsNotEmpty()
  proposedName: string;

  @IsString()
  @IsNotEmpty()
  proposedAddress: string;

  @IsString()
  @IsNotEmpty()
  proposedDateStart: string; // ISO Date String

  @IsString()
  @IsNotEmpty()
  proposedDateEnd: string; // ISO Date String
}

// Output DTO matching the requested JSON structure
export class ProposalResponseDto {
  @IsNumber()
  long: number; // proposedLongitude

  @IsNumber()
  lat: number; // proposedLatitude

  @IsString()
  @IsOptional()
  whether: string; // The weather summary

  @IsString()
  @IsOptional()
  prediction: string; // The prediction with grade
}

// Internal structure for handling grounded source data
export interface SourceAttribution {
  uri: string;
  title: string;
}

// Extended response interface to include sources for debugging/display
export interface FullProposalResponse extends ProposalResponseDto {
  sources: SourceAttribution[];
}