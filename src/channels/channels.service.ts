import { elastic } from '@/lib/elastic';
import { Result } from '@/lib/types';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

type TEsCatIndeciesResponse = Awaited<ReturnType<typeof elastic.cat.indices>>;

type TGetChannelsError = 'ERR_ES_UNSUCCESSFUL_RESPONSE';

type TEsCreateIndexResponse = Awaited<
    ReturnType<typeof elastic.indices.create>
>;

type TCreateChannelError = 'ERR_ES_UNSUCCESSFUL_RESPONSE';

type TEsIndex = Awaited<ReturnType<typeof elastic.indices.get>>;

type TGetChannelError =
    | 'ERR_CHANNEL_NOT_FOUND'
    | 'ERR_ES_UNSUCCESSFUL_RESPONSE';

type TDeleteChannelError =
    | 'ERR_CHANNEL_NOT_FOUND'
    | 'ERR_ES_UNSUCCESSFUL_DELETE';

@Injectable()
export class ChannelsService {
    private isEs404(e: any) {
        return (
            'meta' in e && 'statusCode' in e.meta && e.meta.statusCode === 404
        );
    }

    async getChannels(): Promise<
        Result<TEsCatIndeciesResponse, TGetChannelsError>
    > {
        let channels: TEsCatIndeciesResponse | undefined;
        try {
            channels = await elastic.cat.indices({ format: 'json' });
        } catch {
            return ['ERR_ES_UNSUCCESSFUL_RESPONSE'];
        }

        return [null, channels];
    }

    async createChannel(): Promise<
        Result<TEsCreateIndexResponse, TCreateChannelError>
    > {
        const channelId = randomUUID();

        let channel: TEsCreateIndexResponse | undefined;
        try {
            channel = await elastic.indices.create({
                index: channelId,
                mappings: {
                    properties: {
                        group: { type: 'keyword' },
                        message: { type: 'text' },
                        metadata: { type: 'object' },
                        timestamp: { type: 'date' },
                        inserted: { type: 'date' },
                    },
                },
            });
        } catch {
            return ['ERR_ES_UNSUCCESSFUL_RESPONSE'];
        }

        return [null, channel];
    }

    async getChannelById(
        id: string,
    ): Promise<Result<TEsIndex, TGetChannelError>> {
        let channel: TEsIndex | undefined;
        try {
            channel = await elastic.indices.get({ index: id });
        } catch (e) {
            if (this.isEs404(e)) {
                return ['ERR_CHANNEL_NOT_FOUND'];
            }

            return ['ERR_ES_UNSUCCESSFUL_RESPONSE'];
        }

        return [null, channel];
    }

    async deleteChannel(
        id: string,
    ): Promise<Result<void, TDeleteChannelError>> {
        try {
            await elastic.indices.delete({ index: id });
        } catch (e) {
            if (this.isEs404(e)) {
                return ['ERR_CHANNEL_NOT_FOUND'];
            }

            return ['ERR_ES_UNSUCCESSFUL_DELETE'];
        }

        return [null];
    }
}
