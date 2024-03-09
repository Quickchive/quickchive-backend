import { Test } from '@nestjs/testing';
import { ImageService } from './image.service.interface';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import axios from 'axios';

jest.setTimeout(30_000);
describe('S3Service', () => {
  let imageService: ImageService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: ImageService,
          useClass: S3Service,
        },
      ],
    }).compile();

    imageService = app.get<ImageService>(ImageService);
  });

  describe('getUploadUrl(presignedUrl을 조회한다.)', () => {
    it('presignedUrl 및 만료기간을 반환한다.', async () => {
      const bucket = 'quickarchive-common-image';
      const key = 'test.jpg';

      const response = await imageService.getUploadUrl({
        directory: bucket,
        filename: key,
      });

      expect(
        response.uploadUrl.startsWith(`http://127.0.0.1:4567/${bucket}/${key}`),
      ).toBeTruthy();
      expect(response.urlExpiredAt).toBeDefined();
    });
  });

  describe('uploadImage(이미지를 직접 업로드한다.)', () => {
    it('이미지를 업로드하고 해당 이미지의 URL을 반환한다.', async () => {
      const bucket = 'quickarchive-common-image';
      const key = 'test.jpg';
      const dummyImageUrl =
        'https://quickarchive-common-image.s3.ap-northeast-2.amazonaws.com/image.png';
      const response = await axios.get(dummyImageUrl, {
        responseType: 'arraybuffer',
      });
      const encodedImage = Buffer.from(response.data, 'binary');

      const url = await imageService.uploadImage({
        directory: bucket,
        filename: key,
        image: encodedImage,
      });

      expect(url).toBeTruthy();
    });
  });
});
