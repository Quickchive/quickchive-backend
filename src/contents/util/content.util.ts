import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios, { AxiosResponse } from 'axios';

interface OGData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  site_name: string;
  [key: string]: string; // 추가 OG 태그를 위한 인덱스 시그니처
}

class OGCrawler {
  private readonly timeout: number;
  private readonly userAgent: string;
  private readonly maxRedirects = 5;

  constructor(options: { timeout?: number; userAgent?: string } = {}) {
    this.timeout = options.timeout || 5000;
    this.userAgent =
      options.userAgent || 'Mozilla/5.0 (compatible; OGCrawler/1.0)';
  }

  public async fetch(url: string): Promise<OGData> {
    try {
      const response: AxiosResponse = await axios({
        method: 'get',
        url,
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
        },
        maxRedirects: this.maxRedirects,
      });

      return this.parse(response.data);
    } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Failed to fetch URL: ${error.message}`,
        );
      }
      throw new InternalServerErrorException('An unknown error occurred');
    }
  }

  private parse(html: string): OGData {
    const $ = cheerio.load(html);
    const ogData: Partial<OGData> = {};

    // OG 태그 파싱
    $('meta[property^="og:"]').each((_, element) => {
      const property = $(element).attr('property')?.replace('og:', '');
      const content = $(element).attr('content');

      if (property && content) {
        ogData[property as keyof OGData] = content;
      }
    });

    // 기본 메타 태그 백업 파싱
    if (!ogData.title) {
      ogData.title =
        $('title').text() || $('meta[name="title"]').attr('content') || '';
    }

    if (!ogData.description) {
      ogData.description = $('meta[name="description"]').attr('content') || '';
    }

    // 이미지 URL 정규화
    if (ogData.image && !ogData.image.startsWith('http')) {
      const baseUrl = $('base').attr('href');
      if (baseUrl) {
        try {
          ogData.image = new URL(ogData.image, baseUrl).href;
        } catch (error) {
          console.warn('Failed to normalize image URL:', error);
        }
      }
    }

    // 필수 필드가 있는 완성된 객체 반환
    return {
      title: ogData.title || '',
      description: ogData.description || '',
      image: ogData.image || '',
      url: ogData.url || '',
      type: ogData.type || '',
      site_name: ogData.site_name || '',
      ...ogData, // 추가 OG 태그 포함
    };
  }
}

export const getLinkInfo = async (link: string) => {
  const crawler = new OGCrawler();
  const ogData = await crawler.fetch(link);

  const title = ogData.title;
  const description = ogData.description;
  const coverImg = ogData.image;
  const siteName = ogData.site_name;

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
