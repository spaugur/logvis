import { Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ChannelsService } from './channels.service';

@Controller('channels')
export class ChannelsController {
    constructor(private channelsService: ChannelsService) {}

    @Get()
    async getChannels() {
        const channels = await this.channelsService.getChannels();

        return channels;
    }

    @Post()
    async createChannel() {
        const channel = await this.channelsService.createChannel();

        return channel;
    }

    @Get(':channelId')
    async getChannel(@Param('channelId') id: string) {
        const channel = await this.channelsService.getChannel(id);

        return channel;
    }

    @Delete(':channelId')
    @HttpCode(204)
    async deleteChannel(@Param('channelId') id: string) {
        await this.channelsService.deleteChannel(id);
    }
}
