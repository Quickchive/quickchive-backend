## declare base image - node 16
FROM node:16.13.1-alpine3.15 AS builder
## make work directory and copy files
WORKDIR /app
COPY . .

# Timezone setting

## copy host's timezone file to container
COPY ./asset/zoneinfo/Asia/Seoul /usr/share/zoneinfo/Asia/Seoul
## set timezone
RUN ln -snf /usr/share/zoneinfo/Asia/Seoul /etc/localtime

## project dependency install
RUN rm -rf dist && npm install
RUN npm run build

FROM node:16.13.1-alpine3.15
WORKDIR /usr/src/app
COPY --from=builder /app ./

EXPOSE 4000
CMD npm run start:prod