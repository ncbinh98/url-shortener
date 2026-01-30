import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { UpdateShortLinkDto } from './dto/update-short-link.dto';
import { ShortLink } from './entities/short-link.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserJwtPayload } from '../auth/interfaces/user-jwt-payload.interface';
import { UtilsService } from 'src/shared/utils/utils.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/infra/redis/redis.module';

@Injectable()
export class ShortLinksService {
  constructor(
    @InjectRepository(ShortLink)
    private shortLinkRepository: Repository<ShortLink>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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

  async findOne(id: string) {
    const shortLink = await this.shortLinkRepository.findOneBy({ id });
    if (!shortLink) {
      throw new NotFoundException(`Short link with ID ${id} not found`);
    }
    return shortLink;
  }

  async resolveShortCode(shortCode: string) {
    const cacheKey = `short_link:${shortCode}`;

    // 1. Try to get from cache
    const cachedUrl = await this.redis.get(cacheKey);
    if (cachedUrl) {
      return { originalUrl: cachedUrl };
    }

    // 2. Try to get from DB
    const shortLink = await this.shortLinkRepository.findOneBy({ shortCode });

    if (!shortLink) {
      throw new NotFoundException(
        `Short link with code ${shortCode} not found`,
      );
    }

    // 3. Check expiration
    if (shortLink.expiredAt && new Date() > shortLink.expiredAt) {
      throw new NotFoundException('Short link has expired');
    }

    // 4. Cache it
    const DEFAULT_TTL = 86400; // 24 hours in seconds
    let ttl = DEFAULT_TTL;

    if (shortLink.expiredAt) {
      const now = new Date().getTime();
      const expiration = shortLink.expiredAt.getTime();
      const remainingSeconds = Math.max(
        0,
        Math.floor((expiration - now) / 1000),
      );

      // Only calculate TTL if it's less than standard 24 hours
      if (remainingSeconds < DEFAULT_TTL) {
        ttl = remainingSeconds;
      }

      // If ttl is 0, it should have been caught by the expiration check,
      // but if it's very close to expiring, we might still get 0.
      if (ttl === 0) return { originalUrl: shortLink.originalUrl };
    }

    await this.redis.set(cacheKey, shortLink.originalUrl, 'EX', ttl);

    return { originalUrl: shortLink.originalUrl };
  }

  update(id: number, updateShortLinkDto: UpdateShortLinkDto) {
    return `This action updates a #${id} shortLink`;
  }

  remove(id: number) {
    return `This action removes a #${id} shortLink`;
  }
}
