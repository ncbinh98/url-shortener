import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ShortLinksService } from './short-links.service';
import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { UpdateShortLinkDto } from './dto/update-short-link.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('short-links')
export class ShortLinksController {
  constructor(private readonly shortLinksService: ShortLinksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createShortLinkDto: CreateShortLinkDto, @Req() req) {
    return this.shortLinksService.create(createShortLinkDto, req.user);
  }

  @Get()
  findAll() {
    return this.shortLinksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shortLinksService.findOne(id);
  }

  @Get('resolve/:shortCode')
  resolve(@Param('shortCode') shortCode: string) {
    return this.shortLinksService.resolveShortCode(shortCode);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShortLinkDto: UpdateShortLinkDto,
  ) {
    return this.shortLinksService.update(+id, updateShortLinkDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shortLinksService.remove(+id);
  }
}
