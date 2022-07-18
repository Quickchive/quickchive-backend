import { IsBoolean } from 'class-validator';

export class CoreOutput {
  @IsBoolean()
  ok: boolean;

  error?: string;
}
