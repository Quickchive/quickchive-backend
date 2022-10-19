### .env.prod

```
JWT_ACCESS_TOKEN_PRIVATE_KEY=
JWT_REFRESH_TOKEN_PRIVATE_KEY=
MAILGUN_API_KEY=
MAILGUN_DOMAIN_NAME=
MAILGUN_TEMPLATE_NAME_FOR_VERIFY_EMAIL=verify-email-for-prod
MAILGUN_TEMPLATE_NAME_FOR_RESET_PASSWORD=reset-password-for-prod
MAILGUN_TEMPLATE_NAME_FOR_NOTIFICATION=deadline-notification-for-prod
REDIS_HOST=
REDIS_PORT=
DB_PORT=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
KAKAO_REST_API_KEY=
KAKAO_REDIRECT_URI_LOGIN=
KAKAO_CLIENT_SECRET=
KAKAO_JS_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_SECRET=
GOOGLE_REDIRECT_URI=
NAVER_API_CLIENT_ID=
NAVER_API_CLIENT_SECRET=
NAVER_CLOVA_SUMMARY_REQUEST_URL=https://naveropenapi.apigw.ntruss.com/text-summary/v1/summarize
```

### test를 위한 환경변수

> <rootDir>/.jest/envFile.ts

```
process.env.NAVER_API_CLIENT_ID = '';
process.env.NAVER_API_CLIENT_SECRET =
  '';
process.env.NAVER_CLOVA_SUMMARY_REQUEST_URL =
  'https://naveropenapi.apigw.ntruss.com/text-summary/v1/summarize';
process.env.MAILGUN_API_KEY =
  '';
process.env.MAILGUN_DOMAIN_NAME = 'hou27.shop';
process.env.MAILGUN_TEMPLATE_NAME_FOR_VERIFY_EMAIL = 'verify-email-for-prod';
process.env.MAILGUN_TEMPLATE_NAME_FOR_RESET_PASSWORD =
  'reset-password-for-prod';
process.env.MAILGUN_TEMPLATE_NAME_FOR_NOTIFICATION =
  'deadline-notification-for-prod';
```

> jest 설정 on package.json

```
"jest": {
    "moduleNameMapper": {
      "^src/(.*)$": "<rootDir>/$1"
    },
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "node_modules",
      ".entity.ts",
      ".constants.ts"
    ],
    "setupFiles": [
      "<rootDir>/.jest/envFile.ts"
    ]
  }
```
