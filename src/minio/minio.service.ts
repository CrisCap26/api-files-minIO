import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';



@Injectable()
export class MinioService {
    private minioClient: Client;
    private readonly bucketName: string;
    private readonly useSSLValidations: boolean = 
        this.configService.get<string>('MINIO_USE_SSL') === "true" ? true : false;

    constructor(private readonly configService: ConfigService) {
        this.minioClient = new Client({
            endPoint: this.configService.get<string>('MINIO_ENDPOINT'),
            port: this.configService.get<number>('MINIO_PORT'),
            useSSL: this.useSSLValidations,
            accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
            secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
        });

        this.bucketName = this.configService.get<string>('MINIO_BUCKET');
        this.ensureBucketExists();
    }

    private async ensureBucketExists() {
        const exists = await this.minioClient.bucketExists(this.bucketName);
        if (!exists) {
            await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
            console.log(`Bucket ${this.bucketName} creado`);
        }
    }

    async uploadFile(file: Express.Multer.File) {
        const fileName = `${Date.now()}-${file.originalname}`;
        await this.minioClient.putObject(
            this.bucketName,
            fileName,
            file.buffer,
            file.size,
            {
                'Content-Type': file.mimetype
            }
        );
        return {
            message: `Archivo ${fileName} subido correctamente`,
            fileName
        };
    }

    async downloadFile(fileName: string) {
        return this.minioClient.getObject(
            this.bucketName,
            fileName
        );
    }

    async listFiles() {
        const objects = this.minioClient.listObjectsV2(this.bucketName, '');
        const files: any[] = [];
        for await (const obj of objects) {
            files.push(obj);
        }
        return files;
    }

    async deleteFile(fileName: string) {
        try {
            // Verificar si el archivo existe
            await this.minioClient.statObject(this.bucketName, fileName);
            
            // Si existe, procedemos a eliminarlo
            await this.minioClient.removeObject(this.bucketName, fileName);
            
            return { message: `El archivo ${fileName} ha sido eliminado` };
          } catch (error) {
            if (error.code === 'NotFound') {
              throw new Error(`El archivo ${fileName} no existe`);
            }
            throw new Error(`Error eliminando el archivo: ${error.message}`);
          }
    }
}
