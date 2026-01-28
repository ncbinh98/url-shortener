import { Test, TestingModule } from '@nestjs/testing';
import { ShortLinksController } from './short-links.controller';
import { ShortLinksService } from './short-links.service';

describe('ShortLinksController', () => {
  let controller: ShortLinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShortLinksController],
      providers: [ShortLinksService],
    }).compile();

    controller = module.get<ShortLinksController>(ShortLinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
