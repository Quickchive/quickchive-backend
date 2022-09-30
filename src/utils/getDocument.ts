import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from 'src/common/logger';

export default async function getDocument(link: string): Promise<string> {
  let document: string = '';

  await axios
    .get(link)
    .then((res) => {
      if (res.status !== 200) {
        console.log(res.status);
        throw new BadRequestException('잘못된 링크입니다.');
      } else {
        const data = res.data;
        if (typeof data === 'string') {
          const $ = cheerio.load(data);
          $('p').each((i, elem) => {
            document += $(elem).text();
          });
        }
      }
    })
    .catch((e) => {
      logger.error(e.message);
    });

  return document;
}
