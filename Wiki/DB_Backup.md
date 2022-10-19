# docker로 띄운 PostgreSQL 서버 데이터 백업

## AWS EC2의 db_backup.sh

```sh
# db_backup.sh

today=$(date "+%Y%m%d")
dumpfile="???/postgres_${today}.sql"
savepath="???/postgres_${today}.sql"

echo "Backup start"
docker exec ubuntu_postgres_1 su - postgres -c "pg_dump postgres > ${dumpfile}"

sleep 3

docker cp ubuntu_postgres_1:${dumpfile} ${savepath}
echo "Backup process complete. Path : ${savepath}"
```

- crontab 통해 주기적으로 데이터 백업
- host에서 아래 명령어를 통해 ec2로 백업된 데이터를 host에도 저장

```bash
# ec2의 파일을 host로 옮김
sudo scp -i [aws key pair 위치] ubuntu@[ec2 ip]:[backup file 위치]/[dump file명] [파일을 저장할 host 내 위치]
```
