# Quickchive Backend

## Description

> [Quickchive](https://quickchive.swygbro.com/)

<br>

# v0.1.0

## Added

> MVP

1. User

- 로그인: OAuth(구글로그인, 카카오로그인), 이메일 로그인(자체 로그인 기능)
- 자동로그인 정책: 한달 동안 접속하지 않아도 로그인 유지 - refresh token 활용(만료 기간 한달)
- 회원가입(이메일 인증방식)
  - 회원가입 시 받는 정보: 이메일(메일로 인증필수), 닉네임(2-8자 이내), 비밀번호(8자 이상 문자, 숫자)
- 닉네임 수정
- 비밀번호 재설정
- 로그아웃
- 회원 탈퇴

2. Content

- 저장: 콘텐츠 이름, \*URL, 메모, 카테고리, 즐겨찾기, 읽을 기한
- 삭제
- 수정: 콘텐츠 이름, 메모, 카테고리, 즐겨찾기, 읽을 기한

3. Collection

- 저장: *콜렉션 이름, 콜렉션 설명, *URL, 카테고리, 즐겨찾기
- 삭제
- 수정: 콘텐츠 이름, URL(추가, 삭제, 순서 변경), 카테고리, 읽을 기한

4. 알림

- 읽을 기한 알림: 매일 08:00 KST에 읽을 기한 만료된 콘텐츠에 대한 메일 알림 전송

## Changed

> first release

## Removed

> first release

## License

Nest is [MIT licensed](LICENSE).

# API 구조

### User API

| URL                         | method | Usage                | Authorization Needed |
| --------------------------- | ------ | -------------------- | -------------------- |
| /api/users/edit             | POST   | 프로필 수정          | O                    |
| /api/users/reset-password   | POST   | 비밀번호 재생성      | X                    |
| /api/users/me               | GET    | 프로필 조회          | O                    |
| /api/users/load-contents    | GET    | 유저의 콘텐츠 조회   | O                    |
| /api/users/load-favorites   | GET    | 유저의 즐겨찾기 조회 | O                    |
| /api/users/load-collections | GET    | 유저의 콜렉션 조회   | O                    |
| /api/users/load-categories  | GET    | 유저의 카테고리 조회 | O                    |

### Auth API

| URL                                               | method | Usage                            | Authorization Needed |
| ------------------------------------------------- | ------ | -------------------------------- | -------------------- |
| /api/auth/register                                | POST   | 회원가입                         | X                    |
| /api/auth/login                                   | POST   | 이메일 로그인                    | X                    |
| /api/auth/logout                                  | POST   | 로그아웃                         | O                    |
| /api/auth/reissue                                 | POST   | 토큰 재발행                      | X                    |
| /api/auth/send-verify-email/\<str:email\>         | GET    | 유저 인증을 위한 메일 전송       | X                    |
| /api/auth/send-password-reset-email/\<str:email\> | GET    | 비밀번호 재설정을 위한 메일 전송 | X                    |
| /api/auth/verify-email                            | GET    | 이메일 인증                      | X                    |

### OAuth API

| URL                     | method | Usage                   | Authorization Needed |
| ----------------------- | ------ | ----------------------- | -------------------- |
| /api/oauth/kakao-auth   | GET    | 카카오 계정 로그인 요청 | X                    |
| /api/oauth/kakao-login  | GET    | 카카오 로그인           | X                    |
| /api/oauth/google-auth  | GET    | 구글 계정 로그인 요청   | X                    |
| /api/oauth/google-login | GET    | 구글 로그인             | X                    |

### Content API

| URL                                      | method | Usage                 | Authorization Needed |
| ---------------------------------------- | ------ | --------------------- | -------------------- |
| /api/contents/add                        | POST   | 콘텐츠 추가           | O                    |
| /api/contents/addMultiple                | POST   | 다수의 콘텐츠 추가    | O                    |
| /api/contents/update                     | POST   | 콘텐츠 정보 수정      | O                    |
| /api/contents/favorite/\<int:contentId>  | PATCH  | 즐겨찾기 등록 및 해제 | O                    |
| /api/contents/read/\<int:contentId>      | PATCH  | 읽었음 표시           | O                    |
| /api/contents/delete/\<int:contentId>    | DELETE | 콘텐츠 삭제           | O                    |
| /api/contents/summarize/\<int:contentId> | GET    | 콘텐츠 문서 요약      | O                    |

### Category API

| URL                                    | method | Usage         | Authorization Needed |
| -------------------------------------- | ------ | ------------- | -------------------- |
| /api/category/add                      | POST   | 카테고리 추가 | O                    |
| /api/category/update                   | POST   | 카테고리 수정 | O                    |
| /api/category/delete/\<int:categoryId> | DELETE | 카테고리 삭제 | O                    |

### Collection API

| URL                                           | method | Usage                 | Authorization Needed |
| --------------------------------------------- | ------ | --------------------- | -------------------- |
| /api/collections/add                          | POST   | 콜렉션 추가           | O                    |
| /api/collections/update                       | POST   | 콜렉션 수정           | O                    |
| /api/collections/favorite/\<int:collectionId> | PATCH  | 즐겨찾기 등록 및 해제 | O                    |
| /api/collections/delete                       | DELETE | 콜렉션 삭제           | O                    |
