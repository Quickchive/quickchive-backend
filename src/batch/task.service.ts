import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { traceDeprecation } from 'process';
import { Collection } from 'src/collections/entities/collection.entity';
import { logger } from 'src/common/logger';
import { Content } from 'src/contents/entities/content.entity';
import { Between, Repository } from 'typeorm';

@Injectable() // Only support SINGLETON scope
export class TaskService {
  constructor(
    @InjectRepository(Content)
    private readonly contents: Repository<Content>,
  ) {}

  @Cron('10 * * * * *', {
    name: 'testjob',
    timeZone: 'Asia/Seoul',
  })
  cronJob() {
    logger.debug('Cron job is running');
  }

  // 매일 아침 8시에 작업 실행
  @Cron('* * * * * *', {
    name: "check article's deadline",
    timeZone: 'Asia/Seoul',
  })
  async checkDeadline() {
    // 만료될 콘텐츠를 찾기 위한 날짜 값 생성
    const date = new Date();
    const year = date.getFullYear(); // 년
    const month = date.getMonth(); // 월
    const day = date.getDate(); // 일

    const utcToday = new Date(
      new Date(year, month, day, 0, 0, 0, 0).toUTCString(),
    );

    // 만료될 콘텐츠를 찾아서 알림
    logger.info("Check article's deadline");
    const contents = await this.contents.find({
      where: {
        deadline: utcToday,
      },
    });
    console.log(contents);
  }
}
