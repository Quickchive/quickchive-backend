import { DynamicModule, Global, Module } from '@nestjs/common';
import { SummaryModuleOptions } from './summary.interface';
import { SummaryService } from './summary.service';

export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';

@Module({})
@Global()
export class SummaryModule {
  static forRoot(options: SummaryModuleOptions): DynamicModule {
    return {
      module: SummaryModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        SummaryService,
      ],
      exports: [SummaryService],
    };
  }
}
