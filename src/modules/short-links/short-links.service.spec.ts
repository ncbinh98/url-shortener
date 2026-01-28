import { Test, TestingModule } from '@nestjs/testing';
import { ShortLinksService } from './short-links.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShortLink } from './entities/short-link.entity';
import { UtilsService } from 'src/shared/utils/utils.service';
import { BadRequestException } from '@nestjs/common';

describe('ShortLinksService', () => {
  let service: ShortLinksService;
  let repositoryMock: any;
  let utilsServiceMock: any;

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
});
