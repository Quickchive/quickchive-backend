import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import OpenAI from 'openai';
import {
  ResponseFormatJSONObject,
  ResponseFormatJSONSchema,
  ResponseFormatText,
} from 'openai/resources';
import { AiService } from '../ai.service';

@Injectable()
export class OpenaiService implements AiService {
  private readonly openAIApi: OpenAI;
  constructor(private readonly configService: ConfigService) {
    this.openAIApi = new OpenAI({
      organization: this.configService.get('OPENAI_ORGANIZATION_ID'),
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async chat({
    messages,
    model,
    temperature,
    responseType,
  }: {
    messages: any[];
    model: string;
    temperature: number;
    responseType: string;
  }): Promise<string | null> {
    try {
      const response = await this.openAIApi.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages,
        temperature: temperature || 0.1,
        ...(responseType && {
          response_format: responseType as unknown as
            | ResponseFormatText
            | ResponseFormatJSONObject
            | ResponseFormatJSONSchema,
        }),
      });

      return response.choices[0].message.content;
    } catch (e) {
      throw e;
    }
  }
}
