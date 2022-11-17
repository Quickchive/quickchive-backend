# docker-compose.yml

> 배포용 ec2 인스턴스에 위치한다.

```yaml
version: '2'

services:
  redis: # Name of container
    image: redis:latest
    restart: always
    ports:
      - 6379:6379
    networks:
      - shared-network
  postgres: # Name of container
    image: postgres:alpine
    restart: always
    env_file:
      - .env.prod
    environment:
      POSTGRES_HOST_AUTH_METHOD: 'trust'
    ports:
      - 5432:5432
    networks:
      - shared-network
  api:
    image: hou27/quickchive_backend:latest
    networks:
      - shared-network
    env_file:
      - .env.prod
    ports:
      - 80:4000
    depends_on:
      - redis
      - postgres
    environment:
      TZ: 'Asia/Seoul'
networks:
  shared-network:
    driver: bridge
```

> api + redis + postgresql

<br>

### 배포 서버와 테스트 서버를 하나의 ec2 내에 구축한 후의 docker-compose 파일

- api server를 제외한 나머지 둘만 올리도록 함.

```yaml
version: '2'

services:
  redis: # Name of container
    image: redis:latest
    restart: always
    ports:
      - 6379:6379
    networks:
      - shared-network
  postgres: # Name of container
    image: postgres:alpine
    restart: always
    env_file:
      - .env.prod
    environment:
      POSTGRES_HOST_AUTH_METHOD: 'trust'
    ports:
      - 5432:5432
    networks:
      - shared-network
networks:
  shared-network:
    driver: bridge
```

api server를 이 docker compose 파일로 올린 redis, postgreSQL 서버와 연결하기 위해선  
실행 시 network에 연결해주어야 한다.

ex)

```sh
docker run -d --name test-api-server -p 3000:4000 --network [docker compose 파일로 생성된 네트워크] --env-file .env.prod hou27/quickchive_backend
```
