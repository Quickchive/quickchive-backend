import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export const logger = winston.createLogger({
  transports: [
    new DailyRotateFile({
      filename: 'errors-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '1024',
      level: 'error',
    }),
    new DailyRotateFile({
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '1024',
      level: 'info',
    }),
  ],
});
