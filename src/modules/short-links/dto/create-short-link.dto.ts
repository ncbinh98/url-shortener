import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateShortLinkDto {
  @IsString()
  originalUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customAlias?: string;

  @IsOptional()
  @IsDateString()
  expiredAt?: string;
}
