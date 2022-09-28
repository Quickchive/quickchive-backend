import { HttpException, Inject, Injectable } from '@nestjs/common';
import { SummaryModuleOptions } from './summary.interface';
import axios from 'axios';
import {
  SummarizeDocumentInput,
  SummarizeDocumentOutput,
} from './dtos/summary-content.dto';
import { CONFIG_OPTIONS } from 'src/common/common.constants';

@Injectable()
export class SummaryService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: SummaryModuleOptions,
  ) {}

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
