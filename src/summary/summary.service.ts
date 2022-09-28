import { Inject, Injectable } from '@nestjs/common';
import { SummaryModuleOptions } from './summary.interface';
import axios from 'axios';
import { SummaryContentInput } from './dtos/summary-content.dto';
import { CONFIG_OPTIONS } from 'src/common/common.constants';

@Injectable()
export class SummaryService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: SummaryModuleOptions,
  ) {}

  async summaryContent({ title, content }: SummaryContentInput) {
    const api_url =
      'https://naveropenapi.apigw.ntruss.com/text-summary/v1/summarize';

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
    console.log(response);
    return response.data;
  }
}
