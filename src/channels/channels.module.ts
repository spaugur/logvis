import { Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { EntriesModule } from './entries/entries.module';

@Module({
    controllers: [ChannelsController],
    providers: [ChannelsService],
    imports: [EntriesModule],
})
export class ChannelsModule {}
