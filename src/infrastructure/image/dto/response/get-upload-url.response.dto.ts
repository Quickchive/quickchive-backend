export class GetUploadUrlResponseDto {
  uploadUrl: string;
  urlExpiredAt: Date;

  constructor(uploadUrl: string, urlExpiredAt: Date) {
    this.uploadUrl = uploadUrl;
    this.urlExpiredAt = urlExpiredAt;
  }
}
