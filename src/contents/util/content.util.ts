import { BadRequestException } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';

export const getLinkInfo = async (link: string) => {
  let title: string | undefined = '';
  let coverImg: string | undefined = '';
  let description: string | undefined = '';
  let siteName: string | undefined;

  if (!link.match(/^(http|https):\/\//)) {
    link = `http://${link}`;
  }

  await axios
    .get(link)
    .then((res) => {
      if (res.status !== 200) {
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
      // Control unreachable link
      // if(e.message === 'Request failed with status code 403') {
      // 403 에러가 발생하는 링크는 크롤링이 불가능한 링크이다.
      // }
      for (let idx = 1; idx < 3; idx++) {
        if (link.split('/').at(-idx) !== '') {
          title = link.split('/').at(-idx);
          break;
        }
      }
      title = title ? title : 'Untitled';
    });

  return {
    title,
    description,
    coverImg,
    siteName,
  };
};

export const getLinkContent = async (link: string) => {
  let content: string | undefined = '';

  if (!link.match(/^(http|https):\/\//)) {
    link = `http://${link}`;
  }

  await axios
    .get(link)
    .then((res) => {
      if (res.status !== 200) {
        throw new BadRequestException('잘못된 링크입니다.');
      } else {
        const data = res.data;
        if (typeof data === 'string') {
          const $ = cheerio.load(data);
          content = '';
          $('p').each((i, elem) => {
            // 모든 p 태그에 대해 작업을 수행합니다.
            content += $(elem).text() + '\n'; // 각 p 태그의 텍스트를 가져와서 누적합니다.
          });
        }
      }
    })
    .catch((e) => {
      // Control unreachable link
      // if(e.message === 'Request failed with status code 403') {
      // 403 에러가 발생하는 링크는 크롤링이 불가능한 링크이다.
      // }
      content = '';
    });

  return content;
};
