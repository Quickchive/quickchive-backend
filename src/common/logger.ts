import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const { combine, label, printf, colorize } = winston.format;
const logFormat = printf(({ level, label, message }) => {
  return `[${label}] ${level}: ${new Date()} ${message}`;
});

const custom_level = {
  levels: {
    error: 0,
    notice: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    notice: 'yellow',
  },
};

export const logger = winston.createLogger({
  level: 'info',
  levels: custom_level.levels,
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
