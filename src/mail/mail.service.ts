import { Inject, Injectable } from '@nestjs/common';
import { EmailVar, MailModuleOptions } from './mail.interface';
import axios from 'axios';
import * as FormData from 'form-data';
import { CONFIG_OPTIONS } from '../common/common.constants';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ) {
    const form = new FormData();
    form.append('from', `Quickchive <mail@${this.options.domain}>`);
    form.append('to', to);
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));

    try {
      await axios.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        form,
        {
          auth: {
            username: 'api',
            password: this.options.apiKey,
          },
        },
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  sendResetPasswordEmail(email: string, name: string, code: string) {
    this.sendEmail(
      email,
      'Reset Your Password',
      this.options.templateNameForResetPassword,
      [
        { key: 'code', value: code },
        { key: 'username', value: name },
      ],
    );
  }

  sendNotificationEmail(email: string, message: string) {
    this.sendEmail(
      email,
      'Notification',
      this.options.templateNameForNotification,
      [{ key: 'message', value: message }],
    );
  }
}
