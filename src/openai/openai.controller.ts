import { Body, Controller, Post } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { CreateCompletionBodyDto } from './dto/create-completion.dto';
import { CreateChatCompletionResponse } from 'openai';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('/chat-completion')
  async createChatCompletion(
    @Body() createCompletionBodyDto: CreateCompletionBodyDto,
  ): Promise<CreateChatCompletionResponse> {
    return this.openaiService.createChatCompletion(createCompletionBodyDto);
  }
}
