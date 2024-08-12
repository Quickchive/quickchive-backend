import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration, CreateChatCompletionResponse, OpenAIApi } from 'openai';
import { CreateCompletionBodyDto } from './dto/create-completion.dto';

@Injectable()
export class OpenaiService {
  private readonly openAIApi: OpenAIApi;
  constructor(private readonly configService: ConfigService) {
    this.openAIApi = new OpenAIApi(
      new Configuration({
        organization: this.configService.get('OPENAI_ORGANIZATION_ID'),
        apiKey: this.configService.get('OPENAI_API_KEY'),
      }),
    );
  }

  async createChatCompletion({
    question,
    model,
    temperature,
  }: CreateCompletionBodyDto): Promise<CreateChatCompletionResponse> {
    try {
      const { data } = await this.openAIApi.createChatCompletion({
        model: model || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: question,
          },
        ],
        temperature: temperature || 0.1,
      });

      return data;
    } catch (e) {
      throw e;
    }
  }
}
