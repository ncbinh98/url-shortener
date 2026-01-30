import { Test, TestingModule } from '@nestjs/testing';
import { ShortLinksService } from './short-links.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShortLink } from './entities/short-link.entity';
import { UtilsService } from 'src/shared/utils/utils.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { REDIS_CLIENT } from 'src/infra/redis/redis.module';

describe('ShortLinksService', () => {
  let service: ShortLinksService;
  let repositoryMock: any;
  let utilsServiceMock: any;
  let redisMock: any;

  beforeEach(async () => {
    repositoryMock = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    utilsServiceMock = {
      canonicalizeUrl: jest.fn((url) => url),
      hashCanonicalUrl: jest.fn((url) => `hash_${url}`),
      encodeHexToBase62: jest.fn((hash) => 'shortcode'),
    };

    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortLinksService,
        {
          provide: getRepositoryToken(ShortLink),
          useValue: repositoryMock,
        },
        {
          provide: UtilsService,
          useValue: utilsServiceMock,
        },
        {
          provide: REDIS_CLIENT,
          useValue: redisMock,
        },
      ],
    }).compile();

    service = module.get<ShortLinksService>(ShortLinksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userPayload = { email: 'test@example.com', sub: 'user-id' } as any;

    it('should create a short link using customAlias as shortCode', async () => {
      const dto = {
        originalUrl: 'https://example.com',
        customAlias: 'my-alias',
      };
      repositoryMock.findOneBy.mockResolvedValue(null);
      repositoryMock.save.mockResolvedValue({
        id: 'uuid',
        ...dto,
        shortCode: 'my-alias', // Should be the alias
      });

      const result = await service.create(dto, userPayload);

      expect(repositoryMock.findOneBy).toHaveBeenCalledWith({
        shortCode: 'my-alias',
      });
      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          shortCode: 'my-alias',
        }),
      );
      expect(result.shortCode).toBe('my-alias');
    });

    it('should throw BadRequestException if customAlias is already taken as shortCode', async () => {
      const dto = {
        originalUrl: 'https://example.com',
        customAlias: 'taken-alias',
      };
      repositoryMock.findOneBy.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(dto, userPayload)).rejects.toThrow(
        BadRequestException,
      );
      expect(repositoryMock.findOneBy).toHaveBeenCalledWith({
        shortCode: 'taken-alias',
      });
    });

    it('should create a short link with expiredAt', async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      const dto = {
        originalUrl: 'https://example.com',
        expiredAt: expiryDate.toISOString(),
      };

      repositoryMock.findOneBy.mockResolvedValue(null);
      repositoryMock.save.mockResolvedValue({ id: 'uuid', ...dto });

      const result = await service.create(dto, userPayload);

      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          expiredAt: expect.any(Date),
        }),
      );
      const savedExpiredAt = repositoryMock.save.mock.calls[0][0].expiredAt;
      expect(savedExpiredAt.toISOString()).toBe(expiryDate.toISOString());
    });

    it('should generate a shortCode if no customAlias is provided', async () => {
      const dto = { originalUrl: 'https://example.com' };
      repositoryMock.findOneBy.mockResolvedValue(null);
      repositoryMock.save.mockResolvedValue({
        id: 'uuid',
        ...dto,
        shortCode: 'shortcode',
      });

      const result = await service.create(dto, userPayload);

      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          shortCode: 'shortcode',
        }),
      );
      expect(result.shortCode).toBe('shortcode');
    });
  });

  describe('resolveShortCode', () => {
    const shortCode = 'testCode';
    const originalUrl = 'https://example.com';

    it('should return from cache if exists', async () => {
      redisMock.get.mockResolvedValue(originalUrl);

      const result = await service.resolveShortCode(shortCode);

      expect(redisMock.get).toHaveBeenCalledWith(`short_link:${shortCode}`);
      expect(repositoryMock.findOneBy).not.toHaveBeenCalled();
      expect(result).toEqual({ originalUrl });
    });

    it('should cache for 24h if no expiredAt', async () => {
      redisMock.get.mockResolvedValue(null);
      repositoryMock.findOneBy.mockResolvedValue({
        shortCode,
        originalUrl,
        expiredAt: null,
      });

      await service.resolveShortCode(shortCode);

      expect(redisMock.set).toHaveBeenCalledWith(
        `short_link:${shortCode}`,
        originalUrl,
        'EX',
        86400,
      );
    });

    it('should cache for 24h if expiredAt is > 24h away', async () => {
      redisMock.get.mockResolvedValue(null);
      const farFuture = new Date();
      farFuture.setHours(farFuture.getHours() + 48); // 48 hours away
      repositoryMock.findOneBy.mockResolvedValue({
        shortCode,
        originalUrl,
        expiredAt: farFuture,
      });

      await service.resolveShortCode(shortCode);

      expect(redisMock.set).toHaveBeenCalledWith(
        `short_link:${shortCode}`,
        originalUrl,
        'EX',
        86400,
      );
    });

    it('should cache with dynamic TTL if expiredAt is < 24h away', async () => {
      redisMock.get.mockResolvedValue(null);
      const nearFuture = new Date();
      nearFuture.setHours(nearFuture.getHours() + 1); // 1 hour away
      repositoryMock.findOneBy.mockResolvedValue({
        shortCode,
        originalUrl,
        expiredAt: nearFuture,
      });

      const result = await service.resolveShortCode(shortCode);

      const expectedTtl = Math.floor(
        (nearFuture.getTime() - Date.now()) / 1000,
      );
      expect(redisMock.set).toHaveBeenCalledWith(
        `short_link:${shortCode}`,
        originalUrl,
        'EX',
        expect.any(Number),
      );

      const actualTtl = redisMock.set.mock.calls[0][3];
      expect(actualTtl).toBeLessThanOrEqual(expectedTtl + 2);
      expect(actualTtl).toBeGreaterThanOrEqual(expectedTtl - 2);
      expect(result).toEqual({ originalUrl });
    });

    it('should throw NotFoundException if not in cache and not in DB', async () => {
      redisMock.get.mockResolvedValue(null);
      repositoryMock.findOneBy.mockResolvedValue(null);

      await expect(service.resolveShortCode(shortCode)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if link is expired', async () => {
      redisMock.get.mockResolvedValue(null);
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      repositoryMock.findOneBy.mockResolvedValue({
        shortCode,
        originalUrl,
        expiredAt: pastDate,
      });

      await expect(service.resolveShortCode(shortCode)).rejects.toThrow(
        NotFoundException,
      );
      expect(redisMock.set).not.toHaveBeenCalled();
    });
  });
});
