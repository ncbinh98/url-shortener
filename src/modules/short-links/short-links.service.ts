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
    const canonicalUrl = this.utilsService.canonicalizeUrl(
      createShortLinkDto.originalUrl,
    );
    const hashCodeCanonicalUrl =
      this.utilsService.hashCanonicalUrl(canonicalUrl);

    const existUrl = await this.shortLinkRepository.findOneBy({
      canonicalHash: hashCodeCanonicalUrl,
    });
    if (existUrl) {
      return existUrl;
    }

    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // 1. Add salt only if retrying
      const saltedInput =
        attempt === 0 ? canonicalUrl : `${canonicalUrl}#${attempt}`;

      // 2. Hash
      const hashCode = this.utilsService.hashCanonicalUrl(saltedInput);

      // 3. Base62 encode + truncate to 8 chars
      const shortCode = this.utilsService.encodeHexToBase62(hashCode);

      try {
        return await this.shortLinkRepository.save({
          ...createShortLinkDto,
          shortCode,
          canonicalUrl,
          canonicalHash: hashCode,
          createdBy: userPayload?.email,
        });
      } catch (error) {
        // 4. If not a unique constraint error, rethrow
        if (
          !error?.message?.includes(
            'duplicate key value violates unique constraint',
          )
        ) {
          throw error;
        }
        // Otherwise: collision → retry
      }
    }

    throw new BadRequestException('Url existed. Please try again.');
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
