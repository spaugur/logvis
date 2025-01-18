import {
    BadRequestException,
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpCode,
    InternalServerErrorException,
    Param,
    Post,
} from '@nestjs/common';
import { EntriesService, TEntry } from './entries.service';
import { TResponseData } from '@/lib/types';

const ParseDatePipe = new DefaultValuePipe(() => new Date());

@Controller('channels/:channelId/entries')
export class EntriesController {
    constructor(private entriesService: EntriesService) {}

    @Get()
    async getEntries(@Param('channelId') channelId: string) {
        const [err, entries] = await this.entriesService.getEntries(channelId);
        if (!err) {
            return entries;
        }

        switch (err) {
            case 'ERR_CHANNEL_NOT_FOUND': {
                throw new BadRequestException(
                    'The requested channel could not be found.',
                    { description: err },
                );
            }

            case 'ERR_ES_UNSUCCESSFUL_SEARCH': {
                throw new InternalServerErrorException(
                    'Elasticsearch could not query the requested index (channel), please try again.',
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
    @HttpCode(201)
    async createEntry(
        @Param('channelId') channelId: string,
        @Body('group') group: string,
        @Body('message') message: string,
        @Body('metadata') metadata: any,
        @Body('timestamp', ParseDatePipe) timestamp: Date,
    ): Promise<TResponseData<TEntry>> {
        const [err, entry] = await this.entriesService.createEntry(
            channelId,
            group,
            message,
            metadata,
            timestamp,
        );
        if (!err) {
            return { data: entry };
        }

        switch (err) {
            case 'ERR_ES_UNSUCCESSFUL_RESPONSE': {
                throw new InternalServerErrorException(
                    'Elasticsearch could not create the entry, please try again.',
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

    @Get(':entryId')
    async getEntry(
        @Param('channelId') channelId: string,
        @Param('entryId') entryId: string,
    ): Promise<TResponseData<TEntry>> {
        const [err, entry] = await this.entriesService.getEntryById(
            channelId,
            entryId,
        );
        if (!err) {
            return { data: entry };
        }

        switch (err) {
            case 'ERR_ES_SOURCE_NOT_ACCESSIBLE': {
                throw new InternalServerErrorException(
                    'The _source object of the entry document in Elasticsearch could not be accessed.',
                    { description: err },
                );
            }

            case 'ERR_ES_SOURCE_KEYS_NOT_ALL_ACCESSIBLE': {
                throw new InternalServerErrorException(
                    'Not all required keys of the _source objectr of the entry document in Elasticsearch could be accessed.',
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

    @Delete(':entryId')
    async deleteEntry(
        @Param('channelId') channelId: string,
        @Param('entryId') entryId: string,
    ): Promise<void> {
        const [err] = await this.entriesService.deleteEntry(channelId, entryId);
        switch (err) {
            case 'ERR_CHANNEL_NOT_FOUND': {
                throw new BadRequestException(
                    'The requested channel could not be found.',
                    { description: err },
                );
            }

            case 'ERR_ENTRY_NOT_FOUND': {
                throw new BadRequestException(
                    'The requested entry could not be found.',
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
