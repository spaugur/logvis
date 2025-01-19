import { elastic } from '@/lib/elastic';
import { Result } from '@/lib/types';
import { SearchHitsMetadata } from '@elastic/elasticsearch/lib/api/types';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type TEntry = {
    entryId: string;
    channelId: string;
    group: string;
    message: string;
    metadata: any;
    timestamp: Date;
    inserted: Date;
};

export type TFormatEntryError =
    | 'ERR_ES_SOURCE_NOT_ACCESSIBLE'
    | 'ERR_ES_SOURCE_KEYS_NOT_ALL_ACCESSIBLE';

export type TCreateEntryError = 'ERR_ES_UNSUCCESSFUL_RESPONSE';

export type TGetEntryByIdError =
    | TFormatEntryError
    | 'ERR_ENTRY_NOT_FOUND'
    | 'ERR_ES_UNSUCCESSFUL_RESPONSE'
    | 'ERR_CHANNEL_NOT_FOUND';

export type TGetEntriesError =
    | 'ERR_ES_UNSUCCESSFUL_SEARCH'
    | 'ERR_CHANNEL_NOT_FOUND';

export type TGetEntriesResponse = Result<
    {
        entries: TEntry[];
        elasticsearch: Omit<SearchResponse, 'hits'> & {
            hits: Omit<SearchHitsMetadata, 'hits'>;
        };
    },
    TGetEntriesError
>;

export type TDeleteEntryError =
    | 'ERR_ES_UNSUCCESSFUL_DELETE'
    | 'ERR_ENTRY_NOT_FOUND'
    | 'ERR_CHANNEL_NOT_FOUND';

@Injectable()
export class EntriesService {
    private formatEntry(
        entry: Awaited<ReturnType<typeof elastic.get>>,
    ): Result<TEntry, TFormatEntryError> {
        if (typeof entry._source !== 'object' || entry._source === null) {
            return ['ERR_ES_SOURCE_NOT_ACCESSIBLE'];
        }

        if (
            !('group' in entry._source) ||
            typeof entry._source.group !== 'string' ||
            !('message' in entry._source) ||
            typeof entry._source.message !== 'string' ||
            !('metadata' in entry._source) ||
            !('timestamp' in entry._source) ||
            typeof entry._source.timestamp !== 'string' ||
            !('inserted' in entry._source) ||
            typeof entry._source.inserted !== 'string'
        ) {
            return ['ERR_ES_SOURCE_KEYS_NOT_ALL_ACCESSIBLE'];
        }

        return [
            null,
            {
                entryId: entry._id,
                channelId: entry._index,
                group: entry._source.group,
                message: entry._source.message,
                metadata: entry._source.metadata,
                timestamp: new Date(entry._source.timestamp),
                inserted: new Date(entry._source.inserted),
            },
        ];
    }

    private isEs404(e: any) {
        return (
            'meta' in e && 'statusCode' in e.meta && e.meta.statusCode === 404
        );
    }

    async createEntry(
        channel: string,
        group: string,
        message: string,
        metadata: any,
        timestamp: Date,
    ): Promise<Result<TEntry, TCreateEntryError>> {
        const entryId = randomUUID();
        const inserted = new Date();

        try {
            await elastic.index({
                index: channel,
                id: entryId,
                document: {
                    group,
                    message,
                    metadata,
                    timestamp,
                    inserted,
                },
            });
        } catch {
            return ['ERR_ES_UNSUCCESSFUL_RESPONSE'];
        }

        return [
            null,
            {
                entryId,
                channelId: channel,
                group,
                message,
                metadata,
                timestamp,
                inserted,
            },
        ];
    }

    async getEntryById(
        channel: string,
        id: string,
    ): Promise<Result<TEntry, TGetEntryByIdError>> {
        const indexExists = await elastic.indices.exists({ index: channel });
        if (!indexExists) {
            return ['ERR_CHANNEL_NOT_FOUND'];
        }

        let entry: Awaited<ReturnType<typeof elastic.get>> | undefined;
        try {
            entry = await elastic.get({
                index: channel,
                id,
            });
        } catch (e) {
            if (this.isEs404(e)) {
                return ['ERR_ENTRY_NOT_FOUND'];
            }

            return ['ERR_ES_UNSUCCESSFUL_RESPONSE'];
        }

        const [err, fmtdEntry] = this.formatEntry(entry);
        if (err) {
            return [err];
        }

        return [null, fmtdEntry];
    }

    async getEntries(channel: string): Promise<TGetEntriesResponse> {
        let entries: Awaited<ReturnType<typeof elastic.search>> | undefined;
        try {
            entries = await elastic.search({
                index: channel,
                sort: [
                    { group: { order: 'desc' } },
                    { timestamp: { order: 'desc' } },
                    '_score',
                ],
            });
        } catch (e) {
            if (this.isEs404(e)) {
                return ['ERR_CHANNEL_NOT_FOUND'];
            }

            return ['ERR_ES_UNSUCCESSFUL_SEARCH'];
        }

        let entriesFmtd: TEntry[] = [];
        for (let i = 0; i < entries.hits.hits.length; i++) {
            const hit = entries.hits.hits[i];
            if (
                typeof hit._source !== 'object' ||
                typeof hit._source === null ||
                !('group' in hit._source) ||
                typeof hit._source.group !== 'string' ||
                !('message' in hit._source) ||
                typeof hit._source.message !== 'string' ||
                !('metadata' in hit._source) ||
                !('timestamp' in hit._source) ||
                typeof hit._source.timestamp !== 'string' ||
                !('inserted' in hit._source) ||
                typeof hit._source.inserted !== 'string'
            ) {
                continue;
            }

            entriesFmtd.push({
                entryId: hit._id,
                channelId: hit._index,
                group: hit._source.group,
                message: hit._source.message,
                metadata: hit._source.metadata,
                timestamp: new Date(hit._source.timestamp),
                inserted: new Date(hit._source.inserted),
            });
        }

        return [
            null,
            {
                entries: entriesFmtd,
                elasticsearch: {
                    took: entries.took,
                    timed_out: entries.timed_out,
                    _shards: entries._shards,
                    hits: {
                        total: entries.hits.total,
                        max_score: entries.hits.max_score,
                    },
                },
            },
        ];
    }

    async deleteEntry(
        channel: string,
        id: string,
    ): Promise<Result<void, TDeleteEntryError>> {
        const indexExists = await elastic.indices.exists({ index: channel });
        if (!indexExists) {
            return ['ERR_CHANNEL_NOT_FOUND'];
        }

        try {
            await elastic.delete({ index: channel, id });
        } catch (e) {
            if (this.isEs404(e)) {
                return ['ERR_ENTRY_NOT_FOUND'];
            }

            return ['ERR_ES_UNSUCCESSFUL_DELETE'];
        }

        return [null];
    }
}
