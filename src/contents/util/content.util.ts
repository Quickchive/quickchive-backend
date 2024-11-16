import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios, { AxiosResponse } from 'axios';

interface OGCrawlerOptions {
  timeout?: number;
  userAgent?: string;
  maxRedirects?: number;
  cookies?: string;
  proxy?: string;
}

class OGCrawler {
  private readonly timeout: number;
  private readonly userAgent: string;
  private readonly maxRedirects: number;
  private readonly cookies: string;
  private readonly proxy?: string;

  constructor(options: OGCrawlerOptions = {}) {
    this.timeout = options.timeout || 5000;
    this.userAgent =
      options.userAgent ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    this.maxRedirects = options.maxRedirects || 5;
    this.cookies =
      options.cookies || 'CONSENT=YES+cb; Path=/; Domain=.youtube.com';
    this.proxy = options.proxy;
  }

  public async fetch(url: string): Promise<any> {
    try {
      // YouTube 비디오 ID 추출
      const videoId = this.extractVideoId(url);
      if (videoId) {
        return await this.fetchYouTubeData(videoId);
      }

      const response: AxiosResponse = await axios({
        method: 'get',
        url,
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Cookie: this.cookies,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          DNT: '1',
        },
        maxRedirects: this.maxRedirects,
        ...(this.proxy
          ? {
              proxy: {
                host: this.proxy.split(':')[0],
                port: parseInt(this.proxy.split(':')[1]),
              },
            }
          : {}),
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

  private async fetchYouTubeData(videoId: string): Promise<any> {
    try {
      const { data } = await axios.get(
        'https://www.googleapis.com/youtube/v3/videos',
        {
          params: {
            part: 'snippet',
            id: videoId,
            key: process.env.YOUTUBE_DATA_API_KEY!,
          },
        },
      );

      const item = data?.items[0];

      if (item && item.snippet) {
        return {
          title: item.snippet.title,
          description: item.snippet.description,
          coverImg: item.snippet.thumbnails?.default?.url,
          siteName: 'YouTube',
        };
      }
    } catch (error) {
      console.error('Failed to fetch YouTube data:', error);
    }

    // 폴백: 기본 썸네일 URL 사용
    return {
      title: '',
      description: '',
      coverImg: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      siteName: 'YouTube',
    };
  }

  private extractVideoId(url: string): string | null {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  }

  private parse(html: string): any {
    const $ = cheerio.load(html);
    const ogData: any = {};

    $('meta[property^="og:"]').each((_, element) => {
      const property = $(element).attr('property')?.replace('og:', '');
      const content = $(element).attr('content');

      if (property && content) {
        ogData[property] = content;
      }
    });

    return {
      title: ogData.title || $('title').text() || '',
      description:
        ogData.description ||
        $('meta[name="description"]').attr('content') ||
        '',
      coverImg: ogData.image || '',
      siteName: ogData.site_name || '',
    };
  }
}

export const getLinkInfo = async (link: string) => {
  const crawler = new OGCrawler({
    timeout: 5000,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    cookies: 'CONSENT=YES+cb; Path=/; Domain=.youtube.com',
  });
  const ogData = await crawler.fetch(link);

  const title = ogData.title;
  const description = ogData.description;
  const coverImg = ogData.coverImg;
  const siteName = ogData.siteName;

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
