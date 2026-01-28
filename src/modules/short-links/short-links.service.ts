import { Injectable } from '@nestjs/common';
import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { UpdateShortLinkDto } from './dto/update-short-link.dto';
import { ShortLink } from './entities/short-link.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserJwtPayload } from '../auth/interfaces/user-jwt-payload.interface';

@Injectable()
export class ShortLinksService {
  constructor(
    @InjectRepository(ShortLink)
    private shortLinkRepository: Repository<ShortLink>,
  ) {}
  async create(
    createShortLinkDto: CreateShortLinkDto,
    userPayload: UserJwtPayload,
  ) {
    //Canonicalize URL
    //hashCode
    //shortCode encoded base62
    //ShortCode get 7 chars

    return this.shortLinkRepository.save({
      ...createShortLinkDto,
      shortCode: 'shortCode',
      createdBy: userPayload?.email,
    });
  }

  findAll() {
    return `This action returns all shortLinks`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shortLink`;
  }

  update(id: number, updateShortLinkDto: UpdateShortLinkDto) {
    return `This action updates a #${id} shortLink`;
  }

  remove(id: number) {
    return `This action removes a #${id} shortLink`;
  }
}
