import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { getKoreaTime, logger } from '../common/logger';
import { Content } from '../contents/entities/content.entity';
import { MailService } from '../mail/mail.service';
import { Repository } from 'typeorm';

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
    const koreaNow = getKoreaTime(); // 한국 시간을 가져옴.
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
    const contents = await this.contents
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.user', 'user')
      .where('content.reminder = :reminder', { reminder: utcToday })
      .getMany();
    if (contents.length > 0) {
      // 알림
      for (const content of contents) {
        const userEmail = content.user.email;
        const message = `"${content.title}"의 기한이 오늘까지입니다.`;
        await this.mailService.sendNotificationEmail(userEmail, message);
        logger.log({
          level: 'notice',
          message: `Send notification email to ${userEmail} with message: ${message}`,
        });
      }
    }
  }
}
