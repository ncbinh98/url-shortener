import { IsOptional } from 'class-validator';

export class QueryUserDto {
  @IsOptional()
  email: string;

  @IsOptional()
  isActive: string;

  @IsOptional()
  page?: string;

  @IsOptional()
  limit?: string;
}
