import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { logger } from 'src/common/logger';

@Injectable() // Only support SINGLETON scope
export class TaskService {
  @Cron('* * * * * *', {
    name: 'testjob',
    timeZone: 'Asia/Seoul',
  })
  cronJob() {
    logger.debug('Cron job is running');
  }
}
