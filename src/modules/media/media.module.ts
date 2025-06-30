import { Module } from "@nestjs/common";
import { MediaService } from "./media.service";
import { UploadService } from "src/common/services/ftp.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Media } from "./entity/media.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Media])],
    providers: [MediaService, UploadService],
    exports: [MediaService],
})
export class MediaModule { };