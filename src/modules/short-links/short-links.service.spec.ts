import { Test, TestingModule } from '@nestjs/testing';
import { ShortLinksService } from './short-links.service';

describe('ShortLinksService', () => {
  let service: ShortLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShortLinksService],
    }).compile();

    service = module.get<ShortLinksService>(ShortLinksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
