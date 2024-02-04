import { Injectable, SetMetadata, applyDecorators } from '@nestjs/common';

export const ASPECT = Symbol('ASPECT');

export const Aspect = (metadataKey: string | symbol) =>
  applyDecorators(SetMetadata(ASPECT, metadataKey), Injectable);
