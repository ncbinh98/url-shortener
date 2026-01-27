import { Global, Module } from '@nestjs/common';
import { UtilsService } from './utiles.service';

@Global()
@Module({
  providers: [UtilsService],
  exports: [UtilsService],
})
export class UtilsModule {}
