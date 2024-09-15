import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, label, printf, colorize } = winston.format;
const logFormat = printf(({ level, label, message }) => {
  return `[${label}] ${level}: ${
    getKoreaTime().toUTCString().split(' GMT')[0]
  } GMT+0900 (Korean Standard Time) ${message}`;
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

export function getKoreaTime(): Date {
  const now = new Date(); // 현재 시간
  // 현재 시간을 UTC로 변환한 밀리세컨드값
  const utcNow = now.getTime(); // + now.getTimezoneOffset() * 60 * 1000; 주석처리된 코드는 docker container의 timezone 또한 Asia/Seoul로 설정되어 있어서 필요없음.
  const koreaTimeDiff = 9 * 60 * 60 * 1000; // 한국 시간과 UTC와의 차이(9시간의 밀리세컨드)
  const koreaNow = new Date(utcNow + koreaTimeDiff); // UTC -> 한국 시간

  return koreaNow;
}
