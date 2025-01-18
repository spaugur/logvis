import { Module } from '@nestjs/common';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';

@Module({
  controllers: [EntriesController],
  providers: [EntriesService]
})
export class EntriesModule {}
