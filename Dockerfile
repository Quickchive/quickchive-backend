## declare base image - node 16
FROM node:16.13.1-alpine3.15 AS builder
## make work directory and copy files
WORKDIR /app
COPY . .

## project dependency install
RUN rm -rf dist && npm install
RUN npm run build

FROM node:16.13.1-alpine3.15
WORKDIR /usr/src/app
COPY --from=builder /app ./

# Timezone setting

## install tzdata package for timezone setting
RUN apk add tzdata && ln -snf /usr/share/zoneinfo/Asia/Seoul /etc/localtime

EXPOSE 4000
CMD npm run start:prod