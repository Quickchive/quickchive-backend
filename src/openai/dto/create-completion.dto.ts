import { ResponseType } from 'axios';

export class CreateCompletionBodyDto {
  question!: string;
  model?: string;
  temperature?: number;
  responseType?: ResponseType;
}
