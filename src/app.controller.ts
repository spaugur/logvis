import { Controller, Get } from '@nestjs/common';
import { TResponseData } from '@/lib/types';

@Controller()
export class AppController {
    @Get()
    getApplicationInfo(): TResponseData<null> & { application: any } {
        return {
            data: null,
            application: {
                name: 'logvis',
                description: process.env.LOGVIS_DESCRIPTION,
                version: process.env.LOGVIS_VERSION,
                authors: process.env.LOGVIS_AUTHORS,
                license: process.env.LOGVIS_LICENSE,
            },
        };
    }
}
