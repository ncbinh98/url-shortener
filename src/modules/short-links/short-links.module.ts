import { Module } from '@nestjs/common';
import { ShortLinksService } from './short-links.service';
import { ShortLinksController } from './short-links.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortLink } from './entities/short-link.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShortLink])],
  controllers: [ShortLinksController],
  providers: [ShortLinksService],
})
export class ShortLinksModule {}
