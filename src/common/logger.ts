import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const { combine, label, printf, colorize } = winston.format;
const logFormat = printf(({ level, label, message }) => {
  return `[${label}] ${level}: ${message}`;
});

export const logger = winston.createLogger({
  level: 'debug',
  format: combine(colorize(), label({ label: 'Quickchive' }), logFormat),
  transports: [
    new winston.transports.Console(),
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
