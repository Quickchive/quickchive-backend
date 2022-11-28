# Quickchive Backend

## Description

> [Quickchive](https://quickchive.swygbro.com/)

<br>

# v0.1.0

> releated with quickchive version 1.0

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
| /api/collections/delete/\<int:contentId>      | DELETE | 콜렉션 삭제           | O                    |

## License

Nest is [MIT licensed](LICENSE).
