export interface MailModuleOptions {
  apiKey: string;
  domain: string;
  templateName: string;
}

export interface EmailVar {
  key: string;
  value: string;
}
