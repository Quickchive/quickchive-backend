import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { AutoAspectExecutor } from './auto-aspect.executor';
import { TransactionDecorator } from './transactional.decorator';

@Module({
  imports: [DiscoveryModule],
  providers: [AutoAspectExecutor, TransactionDecorator],
})
export class AopModule {}
