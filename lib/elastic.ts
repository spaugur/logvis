import { Client } from '@elastic/elasticsearch';

export const elastic = new Client({
    node: 'https://127.0.0.1:9200/',
    auth: {
        username: 'elastic',
        password: 'jIQ4lNvSe4mS2Y6He3ZE',
    },
});
