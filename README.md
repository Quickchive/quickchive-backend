# Quickchive Backend

![GitHub release (latest by date)](https://img.shields.io/github/v/release/quickchive/quickchive-backend?style=flat-square)
![deploy](https://github.com/Quickchive/quickchive-backend/actions/workflows/ci-cd.yml/badge.svg)

## Description

[Quickchive](https://quickchive.swygbro.com/)  
[Quickchive Frontend](https://github.com/Quickchive/Quickchive-frontend)

# v1.0.0

> releated with quickchive version 1.0

<br/>

## :open_file_folder: 프로젝트 개요

- 읽어둬야 할 아티클 링크, 참석해야 하는 세미나 링크, 봐둬야 할 영상링크 등 자기개발을 위해 읽어두고 알아야 할 링크를 분류해서 저장할 수 있는 북마크 서비스입니다.

<br/>

## :people_holding_hands: 대상

- 여러가지 이유로 여러 곳에서 다시 볼 목적으로 콘텐츠를 수집하는 사람들

<br/>

## :cloud: 기획 배경

### 마주한 문제

1. **저장해둔 북마크를 다시 읽지 않는 사람들**: 까먹거나, 귀찮아서, 여러 플랫폼에 좋아요/저장/스크랩형태로 읽을 거리를 여기저기 널려놨기 때문에 관리가 힘들어 다시 보지 않습니다.

2. **기존 북마크 서비스를 사용하지 않는 사람들**: 기본 메모앱을 사용하거나, 스크린샷 혹은 카카오톡 나에게 보내기를 사용한다. 이로 인해 저장해둔 북마크를 다시 읽지 않는다는 1번 문제가 다시 발생합니다.

3. **북마크해뒀던 아티클을 읽을 때 부담되는 사람들**: 읽을 거리가 많아서 부담된거나, 영어라서 부담되는 등의 이유로 읽지 않는 사람들도 있습니다.

위와 같은 문제들 탓에 항상 읽어야지 하고 다짐만 하고, 저장한 아티클만 쌓여가는 분들을 위해  
보다 편리하고 빠르게 아티클들을 관리하고 볼 수 있도록 돕고자 기획하게 되었습니다.

<br/>
<br/>

# :computer: API 구조

### User API

| URL                | method | Usage                | Authorization Needed |
| ------------------ | ------ | -------------------- | -------------------- |
| /api/user          | PATCH  | 유저 정보 수정       | O                    |
| /api/user/password | POST   | 비밀번호 재설정      | X                    |
| /api/user          | GET    | 유저 정보 조회       | O                    |
| /api/user          | DELETE | 유저 삭제(회원 탈퇴) | O                    |

### Auth API

| URL                                               | method | Usage                              | Authorization Needed |
| ------------------------------------------------- | ------ | ---------------------------------- | -------------------- |
| /api/auth/register                                | POST   | 회원가입                           | X                    |
| /api/auth/login                                   | POST   | 이메일 로그인                      | X                    |
| /api/auth/logout                                  | POST   | 로그아웃                           | O                    |
| /api/auth/token                                   | POST   | 토큰 재발행(access, refresh token) | X                    |
| /api/auth//send-verification-email/\<str:email\>  | POST   | 새 유저 인증을 위한 메일 전송      | X                    |
| /api/auth/send-password-reset-email/\<str:email\> | POST   | 비밀번호 재설정을 위한 메일 전송   | X                    |
| /api/auth/verify-email?code=\<str:code\>          | GET    | 이메일 인증                        | X                    |

### OAuth API

| URL                     | method | Usage                   | Authorization Needed |
| ----------------------- | ------ | ----------------------- | -------------------- |
| /api/oauth/kakao-auth   | GET    | 카카오 계정 로그인 요청 | X                    |
| /api/oauth/kakao-login  | GET    | 카카오 로그인           | X                    |
| /api/oauth/google-auth  | GET    | 구글 계정 로그인 요청   | X                    |
| /api/oauth/google-login | GET    | 구글 로그인             | X                    |

### Content API

| URL                                      | method | Usage                   | Authorization Needed |
| ---------------------------------------- | ------ | ----------------------- | -------------------- |
| /api/contents                            | POST   | 콘텐츠 추가             | O                    |
| /api/contents/multiple                   | POST   | 다수의 콘텐츠 일괄 추가 | O                    |
| /api/contents                            | PATCH  | 콘텐츠 정보 수정        | O                    |
| /api/contents/\<int:contentsId>/favorite | PATCH  | 즐겨찾기 등록 및 해제   | O                    |
| /api/contents/\<int:contentsId>          | DELETE | 콘텐츠 삭제             | O                    |
| /api/contents                            | GET    | 콘텐츠 조회             | O                    |
| /api/contents/favorite                   | GET    | 콘텐츠 삭제             | O                    |
| /api/contents/\<int:contentId>/summarize | GET    | 콘텐츠 문서 요약        | O                    |

### Category API

| URL                               | method | Usage                     | Authorization Needed |
| --------------------------------- | ------ | ------------------------- | -------------------- |
| /api/categories                   | POST   | 카테고리 추가             | O                    |
| /api/categories                   | PATCH  | 카테고리 수정             | O                    |
| /api/categories/\<int:categoryId> | DELETE | 카테고리 삭제             | O                    |
| /api/categories                   | GET    | 카테고리 조회             | O                    |
| /api/categories/frequent          | GET    | 자주 저장한 카테고리 조회 | O                    |

## License

Nest is [MIT licensed](LICENSE).
