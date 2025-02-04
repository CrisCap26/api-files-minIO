import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MinioService } from './minio.service';
import { MinioController } from './minio.controller';

@Module({
  imports: [ConfigModule],
  providers: [MinioService],
  controllers: [MinioController],
})
export class MinioModule {}
