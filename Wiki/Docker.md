# Dockerfile

```dockerfile
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

EXPOSE 4000
CMD npm run start:prod
```

# Push on docker hub

```bash
docker build -t hou27/bookmark_backend:0.1.0 .

docker run -it --name bookmark_backend hou27/bookmark_backend:0.1.0

docker commit -a "hou27" -m "Ready to deploy aws ec2" bookmark_backend hou27/bookmark_backend:0.1.0

docker push hou27/bookmark_backend:0.1.0
```
