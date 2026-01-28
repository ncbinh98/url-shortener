import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { UpdateShortLinkDto } from './dto/update-short-link.dto';
import { ShortLink } from './entities/short-link.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserJwtPayload } from '../auth/interfaces/user-jwt-payload.interface';
import { UtilsService } from 'src/shared/utils/utils.service';

@Injectable()
export class ShortLinksService {
  constructor(
    @InjectRepository(ShortLink)
    private shortLinkRepository: Repository<ShortLink>,

    private utilsService: UtilsService,
  ) {}

  async create(
    createShortLinkDto: CreateShortLinkDto,
    userPayload: UserJwtPayload,
  ) {
    const { customAlias, expiredAt, originalUrl } = createShortLinkDto;
    const canonicalUrl = this.utilsService.canonicalizeUrl(originalUrl);
    const hashCodeCanonicalUrl =
      this.utilsService.hashCanonicalUrl(canonicalUrl);

    // 1. If customAlias is provided, verify uniqueness and use as shortCode
    if (customAlias) {
      const existing = await this.shortLinkRepository.findOneBy({
        shortCode: customAlias,
      });
      if (existing) {
        throw new BadRequestException('Custom alias is already taken.');
      }

      return await this.shortLinkRepository.save({
        shortCode: customAlias,
        originalUrl,
        canonicalUrl,
        canonicalHash: hashCodeCanonicalUrl,
        createdBy: userPayload?.email,
        expiredAt: expiredAt ? new Date(expiredAt) : undefined,
      });
    }

    // 2. If no customAlias, check if URL already has a generated shortCode
    const existUrl = await this.shortLinkRepository.findOneBy({
      canonicalHash: hashCodeCanonicalUrl,
    });
    if (existUrl) {
      return existUrl;
    }

    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const saltedInput =
        attempt === 0 ? canonicalUrl : `${canonicalUrl}#${attempt}`;

      const hashCode = this.utilsService.hashCanonicalUrl(saltedInput);
      const shortCode = this.utilsService.encodeHexToBase62(hashCode);

      try {
        return await this.shortLinkRepository.save({
          shortCode,
          originalUrl,
          canonicalUrl,
          canonicalHash: hashCode,
          createdBy: userPayload?.email,
          expiredAt: expiredAt ? new Date(expiredAt) : undefined,
        });
      } catch (error) {
        if (
          !error?.message?.includes(
            'duplicate key value violates unique constraint',
          )
        ) {
          throw error;
        }
      }
    }

    throw new BadRequestException(
      'Unable to generate short link. Please try again.',
    );
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
