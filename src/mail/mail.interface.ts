export interface MailModuleOptions {
  apiKey: string;
  domain: string;
  templateNameForVerifyEmail: string;
  templateNameForResetPassword: string;
}

export interface EmailVar {
  key: string;
  value: string;
}
