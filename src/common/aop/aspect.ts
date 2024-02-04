import { SetMetadata } from '@nestjs/common';

export const ASPECT = Symbol('ASPECT');

export const Aspect = (metadataKey: string | symbol) =>
  SetMetadata(ASPECT, metadataKey);
