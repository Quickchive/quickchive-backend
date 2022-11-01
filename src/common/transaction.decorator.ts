import { createParamDecorator } from '@nestjs/common';

export const TransactionManager: () => ParameterDecorator = () => {
  return createParamDecorator((_data, req) => {
    return req.queryRunnerManager;
  });
};
