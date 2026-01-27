import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  refreshToken?: string;

  @IsOptional()
  telegramId?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  emergencyContacts?: Array<{
    name: string;
    email?: string;
    telegramId?: string;
    message?: string;
  }>;
}
