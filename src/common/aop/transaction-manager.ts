import { LazyDecorator } from './lazy-decorator';
import { DataSource } from 'typeorm';
import { Aspect } from './aspect';
import { TRANSACTIONAL } from './transactional';
import { ClsService } from 'nestjs-cls';

export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER');

/**
 * TODO Transaction 전파 등 다양한 케이스를 고려해야 함.
 * 1. 해당 Decorator는 단순 명령을 처리하는 객체이므로, 내부 구현만 달라지면 OK
 * 2. Repository에서 트랜잭션을 매니징할 객체를 시그니처에 명시한다. -> 매니징 객체의 타입이 상당히 애매하다. 어댑터로 추상화를 도울 수 있도록 개선.
 */
@Aspect(TRANSACTIONAL)
export class TransactionManagerService implements LazyDecorator {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cls: ClsService,
  ) {} // TypeORM에 의존하고 있으므로 주의

  wrap(target: unknown, originalFn: any, _: void) {
    return async (...args: any[]) => {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      this.cls.set(TRANSACTION_MANAGER, queryRunner.manager);

      try {
        await originalFn.call(target, ...args, queryRunner.manager);
        await queryRunner.commitTransaction();
      } catch (e) {
        await queryRunner.rollbackTransaction();
        throw e;
      } finally {
        await queryRunner.release();
      }
    };
  }
}
