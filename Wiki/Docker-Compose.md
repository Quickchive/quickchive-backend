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