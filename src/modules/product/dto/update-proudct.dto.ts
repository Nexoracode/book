import { ApiProperty } from '@nestjs/swagger';
export class UploadFilesDto {
    @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
    files: any[];
}