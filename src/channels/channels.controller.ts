import {
    BadRequestException,
    Controller,
    Delete,
    Get,
    HttpCode,
    InternalServerErrorException,
    Param,
    Post,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';

@Controller('channels')
export class ChannelsController {
    constructor(private channelsService: ChannelsService) {}

    @Get()
    async getChannels() {
        const [err, channels] = await this.channelsService.getChannels();
        if (!err) {
            return { data: channels };
        }

        switch (err) {
            case 'ERR_ES_UNSUCCESSFUL_RESPONSE': {
                throw new InternalServerErrorException(
                    'Elasticsearch could not get a list of indecies (channels), please try again.',
                    { description: err },
                );
            }

            default: {
                throw new InternalServerErrorException(
                    'An unhandled error has ocurred.',
                    { description: err },
                );
            }
        }
    }

    @Post()
    async createChannel() {
        const [err, channel] = await this.channelsService.createChannel();
        if (!err) {
            return { data: channel };
        }

        switch (err) {
            case 'ERR_ES_UNSUCCESSFUL_RESPONSE': {
                throw new InternalServerErrorException(
                    'Elasticsearch could not create the index (channel), please try again.',
                    { description: err },
                );
            }

            default: {
                throw new InternalServerErrorException(
                    'An unhandled error has ocurred.',
                    { description: err },
                );
            }
        }
    }

    @Get(':channelId')
    async getChannel(@Param('channelId') id: string) {
        const [err, channel] = await this.channelsService.getChannelById(id);
        if (!err) {
            return { data: channel };
        }

        switch (err) {
            case 'ERR_CHANNEL_NOT_FOUND': {
                throw new BadRequestException(
                    'The requested channel could not be found.',
                    { description: err },
                );
            }

            case 'ERR_ES_UNSUCCESSFUL_RESPONSE': {
                throw new InternalServerErrorException(
                    'Elasticsearch could not get the requested index (channel), please try again.',
                    { description: err },
                );
            }

            default: {
                throw new InternalServerErrorException(
                    'An unhandled error has ocurred.',
                    { description: err },
                );
            }
        }
    }

    @Delete(':channelId')
    @HttpCode(204)
    async deleteChannel(@Param('channelId') id: string) {
        const [err] = await this.channelsService.deleteChannel(id);
        if (err) {
            switch (err) {
                case 'ERR_CHANNEL_NOT_FOUND': {
                    throw new BadRequestException(
                        'The requested channel could not be found.',
                        { description: err },
                    );
                }

                case 'ERR_ES_UNSUCCESSFUL_DELETE': {
                    throw new InternalServerErrorException(
                        'The Elasticsearch document could not be deleted. Please try again.',
                        { description: err },
                    );
                }

                default: {
                    throw new InternalServerErrorException(
                        'An unhandled error has ocurred.',
                        { description: err },
                    );
                }
            }
        }
    }
}
