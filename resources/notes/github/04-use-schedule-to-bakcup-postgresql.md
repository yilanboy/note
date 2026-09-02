# Use Schedule to Backup PostgreSQL

在將資料庫從 PlanetScale 換到 Neon 之後，接下來就要來思考如何備份資料了。

Neon 免費版本提供一天內的備份，但感覺這個時間有點太短了。

如果想要延長備份時間，除了付錢之外，Neon 官方很貼心的提供了另外一種比較便宜的方式，使用 GitHub Action 將資料備份至 S3。這個方式只需要負擔 S3 的存儲費用。

廢話不多說，直接上 workflow 設定檔案的內容。

```yaml
# .github/workflows/backup-postgres-to-s3.yaml
name: Database Backup and Upload

on:
    # 設定定時執行該 workflow
    schedule:
        # 一天備份一次，在世界標準時間每天下午 4:00 運行（台灣地區為午夜 12:00）
        - cron: '0 16 * * *'
    # 如果不想等到時間到才備份資料庫，也可以加入手動觸發的機制
    workflow_dispatch:
        inputs:
            name:
                description: Who to greet
                default: Allen

permissions:
    id-token: write
    contents: read

jobs:
    backup-and-upload:
        runs-on: ubuntu-latest

        steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Install postgresql client
              run: |
                  sudo apt install -y postgresql-common
                  yes '' | sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
                  sudo apt install -y postgresql-client-16

            - name: Set timestamp
              run: echo "TIMESTAMP=$(date -u +'%Y-%m-%d-%H-%M-%S')" >> $GITHUB_ENV

            - name: Dump database
              run: |
                  /usr/lib/postgresql/16/bin/pg_dump -d ${{ secrets.DB_CONNECTION_STRING }} --column-inserts --no-owner -f "${TIMESTAMP}.sql"

            - name: Configure aws credentials
              uses: aws-actions/configure-aws-credentials@v4
              with:
                  role-to-assume: arn:aws:iam::154471991214:role/github_action
                  aws-region: us-west-2

            - name: Upload backup to S3
              run: |
                  YEAR_MONTH=$(date -u +"%Y/%m")
                  aws s3 cp "${TIMESTAMP}.sql" s3://backup.docfunc.com/database/${YEAR_MONTH}/
```

## 參考資料

- [Backups - Neon Docs](https://neon.tech/docs/manage/backups)
- [Nightly Postgres Backups via GitHub Actions](https://joshstrange.com/2024/04/26/nightly-postgres-backups-via-github-actions/)
