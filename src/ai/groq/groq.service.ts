import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { AiService } from '../ai.service';

@Injectable()
export class GroqService implements AiService {
  private readonly groq: Groq;

  constructor(private readonly configService: ConfigService) {
    this.groq = new Groq({
      apiKey: this.configService.get('GROQ_API_KEY'),
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
    const response = await this.groq.chat.completions.create({
      messages,
      model,
      temperature,
      response_format: {
        type: responseType as 'text' | 'json_object' | undefined,
      },
    });

    return response.choices[0].message.content;
  }
}
