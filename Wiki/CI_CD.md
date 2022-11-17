# STEP 1

Build Docker image and Push to Docker Hub

### github action Job 1

```yaml
name: Docker Image CI
runs-on: ubuntu-latest

steps:
  - name: Checkout
    uses: actions/checkout@v3

  - name: Login to DockerHub
    uses: docker/login-action@v2.0.0
    with:
      username: ${{secrets.DOCKERHUB_USERNAME}}
      password: ${{secrets.DOCKERHUB_TOKEN}}

  - name: Build and push Docker images
    uses: docker/build-push-action@v3.1.1
    with:
      context: .
      tags: hou27/quickchive_backend:latest
      # build on feature branches, push only on develop branch
      push: ${{ github.ref == 'refs/heads/develop' }}
```

github의 기본 ubuntu runner 위에서 실행하였다.

# STEP 2

Delete previous docker container and image, pull the latest API server image, and create a new docker compose container

### github action Job 2

```yaml
name: Deploy to EC2
runs-on: quickchive-server

steps:
  - name: executing remote ssh commands using password
    uses: appleboy/ssh-action@master
    with:
      host: ${{ secrets.HOST }}
      username: ubuntu
      key: ${{ secrets.KEY_PAIR }}
      script: |
        sh /home/ubuntu/actions-runner/deploy.sh
```

배포용 ec2를 runner로 설정하여 실행하였다.  
(Setting - Actions - Runners - New self-hosted runner 과정을 거쳐 생성)

## AWS EC2에 설정해둔 파일들

### deploy.sh

> ec2 인스턴스 내에 스크립트 파일 생성  
> 이전 버전의 docker container와 docker image를 삭제한 후 docker hub에 job1을 통해 업로드한 image를 pull하여  
> 해당 이미지를 사용하여 다시 ec2 인스턴스에서 docker 컨테이너를 생성 및 실행한다.

```sh
# !/bin/bash
docker ps -a | grep hou27/quickchive_backend | awk '{print$1}' | xargs -t -I % docker rm -f % && docker image ls | grep hou27/quickchive_backend | awk '{print$3}' | xargs -I % docker rmi %
docker pull hou27/quickchive_backend
cd ~ubuntu && docker run -d --name api-server -p 80:4000 --network ubuntu_shared-network --env-file .env.prod hou27/quickchive_backend
```

- 기존 컨테이너 삭제, 이미지 삭제 후
  docker container 실행

# 전체 github action workflow를 정의한 파일

## ci-cd.yml

```yaml
name: Docker Image CI && Deploy to EC2

on:
  push:
    branches: ['develop']

jobs:
  job1:
    name: Docker Image CI
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Login to DockerHub
        uses: docker/login-action@v2.0.0
        with:
          username: ${{secrets.DOCKERHUB_USERNAME}}
          password: ${{secrets.DOCKERHUB_TOKEN}}

      - name: Build and push Docker images
        uses: docker/build-push-action@v3.1.1
        with:
          context: .
          tags: hou27/quickchive_backend:latest
          # build on feature branches, push only on develop branch
          push: ${{ github.ref == 'refs/heads/develop' }}
  job2:
    needs: job1
    name: Deploy to EC2
    runs-on: quickchive-server

    steps:
      - name: executing remote ssh commands using password
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ubuntu
          key: ${{ secrets.KEY_PAIR }}
          script: |
            sh /home/ubuntu/actions-runner/deploy.sh
```

## ci-cd-for-test.yml

```yaml
name: Docker Image CI && Deploy to EC2 for Test Server

on:
  push:
    branches: ['release/**']

jobs:
  job1:
    name: Docker Image CI
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Login to DockerHub
        uses: docker/login-action@v2.0.0
        with:
          username: ${{secrets.DOCKERHUB_USERNAME}}
          password: ${{secrets.DOCKERHUB_TOKEN}}

      - name: Build and push Docker images
        uses: docker/build-push-action@v3.1.1
        with:
          context: .
          tags: hou27/test_quickchive_backend:latest
          push: true
  job2:
    needs: job1
    name: Deploy to EC2
    runs-on: quickchive-server

    steps:
      - name: executing remote ssh commands using password
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ubuntu
          key: ${{ secrets.KEY_PAIR }}
          script: |
            sh /home/ubuntu/actions-runner/deploy_test_server.sh
```

> deploy.sh는 배포 서버용이었다면,
> deploy_test_server.sh는 테스트 서버용.

```sh
# !/bin/bash
docker ps -a | grep test-api-server | awk '{print$1}' | xargs -t -I % docker rm -f % && docker image ls | grep test_quickchive | awk '{print$3}' | xargs -I % docker rmi %
docker pull hou27/test_quickchive_backend
cd ~ubuntu && docker run -d --name test-api-server -p 3000:4000 --network ubuntu_shared-network --env-file .env.test hou27/test_quickchive_backend
```
