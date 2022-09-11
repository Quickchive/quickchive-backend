import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable() // Only support SINGLETON scope
export class TaskService {
  @Cron('* * * * * *', {
    name: 'testjob',
    timeZone: 'Asia/Seoul',
  })
  cronJob() {
    console.log('Cron job is running');
  }
}
