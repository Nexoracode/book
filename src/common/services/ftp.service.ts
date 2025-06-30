import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as service from 'basic-ftp';
import { Readable } from "typeorm/platform/PlatformTools";

@Injectable()
export class UploadService {
    private client: service.Client;

    constructor() {
        this.client = new service.Client();
        this.client.ftp.verbose = false;
    }

    async uploadFileToServer(
        buffer: Buffer,
        remotePath: string,
        filename: string,
    ): Promise<string> {
        try {
            await this.client.access({
                host: `ftp.${process.env.FTP_HOST}`,
                user: process.env.FTP_USERNAME,
                password: process.env.FTP_PASSWORD,
                secure: false,
            });

            await this.client.ensureDir(`Books/${remotePath}`);
            await this.client.uploadFrom(Readable.from(buffer), filename);
            this.client.close();

            return `https://dl.${process.env.FTP_HOST}/Books/${remotePath}/${filename}`;
        } catch (error) {
            console.error('FTP upload error:', error);
            throw error;
        }
    }
}