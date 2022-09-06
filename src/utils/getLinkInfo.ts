import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function getLinkInfo(link: string) {
  let title: string = '';
  let coverImg: string = '';
  let description: string = '';
  let siteName: string = null;

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
          title = $('title').text() !== '' ? $('title').text() : 'Untitled';
          $('meta').each((i, el) => {
            const meta = $(el);
            if (meta.attr('property') === 'og:image') {
              coverImg = meta.attr('content');
            }
            if (meta.attr('property') === 'og:description') {
              description = meta.attr('content');
            }
            if (meta.attr('property') === 'og:site_name') {
              siteName = meta.attr('content');
            }
          });
        }
      }
    })
    .catch((e) => {
      console.log(e.message);
      // Control unreachable link
      title = link.split('/').at(-1);
    });

  return {
    title,
    description,
    coverImg,
    siteName,
  };
}
