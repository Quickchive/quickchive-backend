import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { SummaryModuleOptions } from './summary.interface';
import { SummaryService } from './summary.service';

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
