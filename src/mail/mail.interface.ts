export interface MailModuleOptions {
  apiKey: string;
  domain: string;
  templateNameForVerifyEmail: string;
  templateNameForResetPassword: string;
  templateNameForNotification: string;
}

export interface EmailVar {
  key: string;
  value: string;
}
