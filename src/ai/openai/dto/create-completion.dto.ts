import {
  ResponseFormatText,
  ResponseFormatJSONObject,
  ResponseFormatJSONSchema,
} from 'openai/resources';

export class CreateCompletionBodyDto {
  question!: string;
  model?: string;
  temperature?: number;
  responseType?:
    | ResponseFormatText
    | ResponseFormatJSONObject
    | ResponseFormatJSONSchema;
}
