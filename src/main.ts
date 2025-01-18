import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
    if (process.env.NODE_ENV !== 'production') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    try {
        const pkg = readFileSync(join(__dirname, '../../package.json'), {
            encoding: 'utf8',
        });
        const pkg_json = JSON.parse(pkg);
        process.env.LOGVIS_VERSION = pkg_json.version;
        process.env.LOGVIS_AUTHORS = pkg_json.author;
        process.env.LOGVIS_LICENSE = pkg_json.license;
        process.env.LOGVIS_DESCRIPTION = pkg_json.description;
    } catch {
        process.env.LOGVIS_VERSION = '?';
        process.env.LOGVIS_AUTHORS = '?';
        process.env.LOGVIS_LICENSE = '?';
        process.env.LOGVIS_DESCRIPTION = '?';
    }

    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
