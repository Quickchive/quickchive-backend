import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ImageService } from './image.service.interface';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { UploadImageDto } from './dto/upload-image.dto';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetUploadUrlResponseDto } from './dto/response/get-upload-url.response.dto';

@Injectable()
export class S3Service implements ImageService {
  private readonly S3Client: S3Client;
  private readonly region: string = 'ap-northeast-2';
  private readonly accessKeyId =
    this.configService.get('AWS_ACCESS_KEY_ID') ?? 'local';
  private readonly secretAccessKey =
    this.configService.get('AWS_SECRET_ACCESS_KEY') ?? 'local';

  constructor(private readonly configService: ConfigService) {
    this.S3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
      maxAttempts: 3,
      ...((process.env.NODE_ENV === 'local' ||
        process.env.NODE_ENV === 'test') && {
        endpoint: 'http://127.0.0.1:4567',
      }),
    });
  }

  async uploadImage({
    directory: Bucket,
    filename: Key,
    image,
  }: UploadImageDto): Promise<string> {
    const uploadCommand = new PutObjectCommand({
      Bucket,
      Key,
      Body: image,
    });

    try {
      await this.S3Client.send(uploadCommand);
      return `https://${Bucket}.s3.amazonaws.com/${Key}`;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('이미지 업로드에 실패했습니다.');
    }
  }

  async getUploadUrl({
    directory: Bucket,
    filename: Key,
  }: GetUploadUrlDto): Promise<GetUploadUrlResponseDto> {
    const putObjectConfig = new PutObjectCommand({
      Bucket,
      Key,
    });
    const urlValidityThresholdInMinutes = 3 * 1000 * 60;
    const now = new Date();
    now.setMinutes(now.getMinutes() + urlValidityThresholdInMinutes);
    const urlExpDate = now;
    const uploadUrl = await getSignedUrl(this.S3Client, putObjectConfig, {
      expiresIn: 60 * 3,
      signingRegion: this.region,
    });

    return new GetUploadUrlResponseDto(uploadUrl, urlExpDate);
  }
}

export const S3ServiceProvider = {
  provide: ImageService,
  useClass: S3Service,
};
