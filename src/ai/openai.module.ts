import { Module } from '@nestjs/common';
import { GroqService } from './groq/groq.service';
import { AiService } from './ai.service';

@Module({
  providers: [{ provide: AiService, useClass: GroqService }],
  exports: [{ provide: AiService, useClass: GroqService }],
})
export class AiModule {}
