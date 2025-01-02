import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { ASPECT } from './aspect';

/**
 * 모듈 초기화 시 전체 프로바이더를 탐색하여 AOP를 활용하는 메서드를 찾습니다.
 */
@Injectable()
export class AutoAspectExecutor implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    const providers = this.discoveryService.getProviders();

    const lazyDecorators = this.lookupLazyDecorator(providers);
    if (lazyDecorators.length === 0) {
      return;
    }

    providers
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .filter(({ instance }) => instance && Object.getPrototypeOf(instance))
      .forEach(({ instance }) => {
        this.metadataScanner.scanFromPrototype(
          instance,
          Object.getPrototypeOf(instance),
          (methodName) => {
            lazyDecorators.forEach((lazyDecorator) => {
              const metadataKey = this.reflector.get(
                ASPECT,
                lazyDecorator.constructor,
              );

              const metadata = this.reflector.get(
                metadataKey,
                instance[methodName],
              );
              if (!metadata) {
                return;
              }
              const wrappedMethod = lazyDecorator.wrap(
                instance,
                instance[methodName],
                metadata,
              );
              instance[methodName] = wrappedMethod;
            });
          },
        );
      });
  }

  private lookupLazyDecorator(providers: InstanceWrapper<any>[]) {
    return providers
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .filter(({ instance, metatype }) => {
        if (!instance || !metatype) {
          return false;
        }

        const aspect = this.reflector.get<string>(ASPECT, metatype);
        if (!aspect) {
          return false;
        }

        return instance.wrap;
      })
      .map(({ instance }) => instance);
  }
}
