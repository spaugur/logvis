import {
    BadRequestException,
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpCode,
    InternalServerErrorException,
    NotFoundException,
    Param,
    PipeTransform,
    Post,
    Query,
} from '@nestjs/common';
import { EntriesService, TEntry } from './entries.service';
import { TResponseData } from '@/lib/types';

const ParseDatePipe = new DefaultValuePipe(() => new Date());

class ParseOptionalBoolPipe implements PipeTransform {
    transform(value: any) {
        if (value === true) {
            return true;
        }

        if (value === 'true') {
            return true;
        }

        if (value === '1') {
            return true;
        }

        if (value === 1) {
            return true;
        }

        return false;
    }
}

@Controller('channels/:channelId/entries')
export class EntriesController {
    constructor(private entriesService: EntriesService) {}

    @Get()
    async getEntries(
        @Param('channelId') channelId: string,
        @Query('includeEsDiagnostics', ParseOptionalBoolPipe)
        includeEsDiagnostics: boolean,
    ): Promise<TResponseData<any> & { elasticsearch?: any }> {
        const [err, entries] = await this.entriesService.getEntries(channelId);
        if (!err) {
            if (includeEsDiagnostics) {
                return {
                    data: entries.entries,
                    elasticsearch: entries.elasticsearch,
                };
            }

            return { data: entries.entries };
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
            case 'ERR_ENTRY_NOT_FOUND': {
                throw new NotFoundException(
                    'No entry with the requested ID could be found.',
                    { description: err },
                );
            }

            case 'ERR_CHANNEL_NOT_FOUND': {
                throw new NotFoundException(
                    'The requested channel could not be found.',
                    { description: err },
                );
            }

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

            case 'ERR_ES_UNSUCCESSFUL_RESPONSE': {
                throw new InternalServerErrorException(
                    'Elasticsearch could not retrieve the entry, please try again.',
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
        if (err) {
            switch (err) {
                case 'ERR_CHANNEL_NOT_FOUND': {
                    throw new NotFoundException(
                        'The requested channel could not be found.',
                        { description: err },
                    );
                }

                case 'ERR_ENTRY_NOT_FOUND': {
                    throw new NotFoundException(
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
}
