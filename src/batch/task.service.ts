import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { traceDeprecation } from 'process';
import { Collection } from 'src/collections/entities/collection.entity';
import { logger } from 'src/common/logger';
import { Content } from 'src/contents/entities/content.entity';
import { MailService } from 'src/mail/mail.service';
import { Between, Repository } from 'typeorm';

@Injectable() // Only support SINGLETON scope
export class TaskService {
  constructor(
    @InjectRepository(Content)
    private readonly contents: Repository<Content>,
    private readonly mailService: MailService,
  ) {}

  // 매일 아침 8시에 작업 실행
  @Cron('0 0 8 * * *', {
    name: "check article's deadline",
    timeZone: 'Asia/Seoul',
  })
  async checkDeadline() {
    // 만료될 콘텐츠를 찾기 위한 날짜 값 생성
    const now = new Date(); // 현재 시간
    const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000; // 현재 시간을 UTC로 변환한 밀리세컨드값
    const koreaTimeDiff = 9 * 60 * 60 * 1000; // 한국 시간과 UTC와의 차이(9시간의 밀리세컨드)
    const koreaNow = new Date(utcNow + koreaTimeDiff); // UTC -> 한국 시간
    const year = koreaNow.getFullYear(); // 년
    const month = koreaNow.getMonth(); // 월
    const day = koreaNow.getDate(); // 일

    const utcToday = new Date(
      new Date(year, month, day, 0, 0, 0, 0).toUTCString(),
    );

    // 만료될 콘텐츠를 찾는다
    logger.log({
      level: 'notice',
      message: "Check article's deadline : " + utcToday,
    });
    const contents = await this.contents.find({
      where: {
        deadline: utcToday,
      },
      relations: {
        user: true,
      },
    });
    if (contents.length > 0) {
      // 알림
      for (const content of contents) {
        const userEmail = content.user.email;
        const message = `${content.title}의 기한이 오늘까지입니다.`;
        await this.mailService.sendNotificationEmail(userEmail, message);
        logger.log({
          level: 'notice',
          message: `Send notification email to ${userEmail} with message: ${message}`,
        });
      }
    }
  }
}
