import { IsString } from 'class-validator';

export class CreateShortLinkDto {
  @IsString()
  originalUrl: string;
}
