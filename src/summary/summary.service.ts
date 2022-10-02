import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { SummaryModuleOptions } from './summary.interface';
import axios from 'axios';
import {
  SummarizeDocumentInput,
  SummarizeDocumentOutput,
} from './dtos/summary-content.dto';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import * as cheerio from 'cheerio';
import { logger } from 'src/common/logger';

@Injectable()
export class SummaryService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: SummaryModuleOptions,
  ) {}

  async getDocument(link: string): Promise<string> {
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
        const errorStatus: number = e.response.status
          ? e.response.status
          : e.status
          ? e.status
          : 500;
        throw new HttpException(e.message, errorStatus ? errorStatus : 500);
      });

    return document;
  }

  async summaryContent({
    title,
    content,
  }: SummarizeDocumentInput): Promise<SummarizeDocumentOutput> {
    try {
      const api_url = this.options.clovaSummaryRequestUrl;

      const client_id = this.options.apiClientId;
      const client_secret = this.options.apiClientSecret;
      const headers = {
        'X-NCP-APIGW-API-KEY-ID': client_id,
        'X-NCP-APIGW-API-KEY': client_secret,
        'Content-Type': 'application/json',
      };
      const body = {
        document: {
          title,
          content,
        },
        option: {
          language: 'ko',
          // model: 'news',
          tone: 0,
          summaryCount: 3,
        },
      };
      // send request to naver server with axios
      const response = await axios.post(api_url, body, { headers });
      return { summary: response.data.summary };
    } catch (e) {
      const errorMessage = e.response.data.error.message
        ? e.response.data.error.message
        : e.message;
      throw new HttpException(
        errorMessage,
        e.response.status ? e.response.status : 500,
      );
    }
  }
}
