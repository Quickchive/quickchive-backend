/**
 * 데코레이터의 초기화를 모듈이 생성되는 시점까지 늦춥니다.
 */
export interface LazyDecorator {
  wrap(
    target: unknown,
    originalFn: any,
    options: void,
  ): MethodDecorator | undefined; // TODO 반환 형식
}
