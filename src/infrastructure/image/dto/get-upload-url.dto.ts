export class GetUploadUrlDto {
  directory: string;
  filename: string;

  constructor(directory: string, filename: string) {
    this.directory = directory;
    this.filename = filename;
  }
}
