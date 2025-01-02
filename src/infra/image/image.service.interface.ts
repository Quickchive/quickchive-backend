import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { GetUploadUrlResponseDto } from './dto/response/get-upload-url.response.dto';
import { UploadImageDto } from './dto/upload-image.dto';

export const ImageService = Symbol('ImageService');

export interface ImageService {
  uploadImage(uploadImageDto: UploadImageDto): Promise<string>;
  getUploadUrl(
    getUploadUrlDto: GetUploadUrlDto,
  ): Promise<GetUploadUrlResponseDto>;
}
