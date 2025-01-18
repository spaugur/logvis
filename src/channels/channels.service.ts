import { elastic } from '@/lib/elastic';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class ChannelsService {
    async getChannels() {
        const channels = await elastic.cat.indices({ format: 'json' });

        return channels;
    }

    async createChannel() {
        const channelId = randomUUID();

        const channel = await elastic.indices.create({
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

        return channel;
    }

    async getChannel(id: string) {
        const channel = await elastic.indices.get({ index: id });

        return channel;
    }

    async deleteChannel(id: string) {
        await elastic.indices.delete({ index: id });
    }
}
