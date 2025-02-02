import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { AutoAspectExecutor } from './auto-aspect.executor';
import { TransactionManagerService } from './transaction-manager';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [DiscoveryModule, ClsModule],
  providers: [AutoAspectExecutor, TransactionManagerService],
})
export class AopModule {}
