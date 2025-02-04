import {
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Res,
    UploadedFile,
    UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MinioService } from './minio.service';


@Controller('files')
export class MinioController {
    constructor(private readonly minioService: MinioService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return this.minioService.uploadFile(file);
    }

    @Get('download/:filename')
    async downloadFile(
        @Param('filename') fileName: string,
        @Res() res: Response,
    ) {
        try {
            const fileStream = await this.minioService.downloadFile(fileName);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            fileStream.pipe(res); // Enviar el archivo como respuesta
        } catch (error) {
            throw new HttpException(
                'Archivo no encontrado',
                HttpStatus.NOT_FOUND
            );
        }
    }

    @Get('list')
    async listFiles() {
        return this.minioService.listFiles();
    }

    @Get('url/:fileName')
    async getFileUrl(@Param('fileName') fileName: string) {
        try {
            const url = await this.minioService.getFileUrl(fileName);
            return { url };
        } catch (error) {
            throw new NotFoundException('El archivo no existe o no se puede acceder.');
        }
    }

    @Delete(':filename')
    async deleteFile(@Param('filename') fileName: string) {
        try {
            return await this.minioService.deleteFile(fileName);
        } catch (error) {
            throw new HttpException(
                error.message,
                HttpStatus.NOT_FOUND
            );
        }
    }
}
