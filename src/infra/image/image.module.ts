import { Module } from '@nestjs/common';
import { S3ServiceProvider } from './s3.service';

@Module({
  providers: [S3ServiceProvider],
  exports: [S3ServiceProvider],
})
export class ImageModule {}
