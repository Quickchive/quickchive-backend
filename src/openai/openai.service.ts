import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CreateCompletionBodyDto } from './dto/create-completion.dto';
import OpenAI from 'openai';
import { ChatCompletion } from 'openai/resources';

@Injectable()
export class OpenaiService {
  private readonly openAIApi: OpenAI;
  constructor(private readonly configService: ConfigService) {
    this.openAIApi = new OpenAI({
      organization: this.configService.get('OPENAI_ORGANIZATION_ID'),
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async createChatCompletion({
    question,
    model,
    temperature,
    responseType,
  }: CreateCompletionBodyDto): Promise<ChatCompletion> {
    try {
      const response = await this.openAIApi.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: question,
          },
        ],
        temperature: temperature || 0.1,
        ...(responseType && { response_format: responseType }),
      });

      return response;
    } catch (e) {
      throw e;
    }
  }
}
