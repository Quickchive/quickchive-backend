export class Payload {
  email!: string; // user email
  period!: string; // '30d' or '2h' that indicates whether or not you are an auto-login user
  sub!: number; // userId
}

export const ONEMONTH = '30d';
export const TWOHOUR = '2h';
