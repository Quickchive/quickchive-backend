export const PROVIDER = {
  GOOGLE: 'google',
  KAKAO: 'kakao',
  APPLE: 'apple',
} as const;

export type PROVIDER = (typeof PROVIDER)[keyof typeof PROVIDER];
