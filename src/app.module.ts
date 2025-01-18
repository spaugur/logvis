import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ChannelsModule } from './channels/channels.module';

@Module({
    imports: [ChannelsModule],
    controllers: [AppController],
    providers: [],
})
export class AppModule {}
