# Elastic File System

AWS 彈性檔案系統 (Amazon Elastic File System，Amazon EFS) 是 AWS 提供的一種雲端儲存服務，提供無伺服器、完全彈性和加密的檔案儲存，供 AWS 運算服務和企業內部使用。

Amazon EFS 支援網路檔案系統 (NFS) 版本 4.0 和 4.1 (NFSv4) 協定，並通過可移植作業系統介面 (POSIX) 權限控制使用者對檔案的訪問。

EFS 可以同時被多個系統或是 AWS 服務掛載。目前 EC2、ECS 與 Lambda 等計算服務皆可以掛載 EFS。

## 在 EC2 上掛載 EFS

EC2 需要手動掛載 EFS。以 Amazon Linux 2023 為例，首先安裝 Amazon EFS 客戶端。

```bash
sudo yum install -y amazon-efs-utils
```

然後在跟目錄底下新建一個 `/efs` 資料夾。

```bash
cd /
sudo mkdir efs
```

接下來就能透過下面的指令掛載 EFS。

```bash
# sudo mount -t efs <FILE-SYSTEM-ID> <EFS-MOUNT-POINT>
# 範例如下
sudo mount -t efs fs-abcd123456789ef0 efs/
```

> [!NOTE]
>
> EC2 掛載 EFS 不需要任何 Policy。

## 在 Lambda 上掛載 EFS

Lambda 上也能掛載 EFS。**但是 Lambda 必須放在 VPC 底下**。
下面以 Terraform 為例，建立一個 EFS 並掛載到 Lambda。

以 Terraform 為例。首先建立一個 EFS。

```hcl
resource "aws_efs_file_system" "efs_for_lambda" {
  performance_mode = "generalPurpose"
  encrypted        = true

  tags = {
    Name = "efs_for_lambda"
  }
}

resource "aws_efs_mount_target" "alpha" {
  file_system_id  = aws_efs_file_system.efs_for_lambda.id
  subnet_id       = aws_subnet.private.id
  security_groups = [aws_security_group.egress_only.id]
}

resource "aws_efs_access_point" "access_point_for_lambda" {
  file_system_id = aws_efs_file_system.efs_for_lambda.id

  root_directory {
    path = "/lambda"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "777"
    }
  }

  posix_user {
    gid = 1000
    uid = 1000
  }
}
```

接下來在 Lambda 中掛載 EFS。

```hcl
resource "aws_lambda_function" "web_lambda_function" {
  depends_on = [aws_efs_mount_target.alpha]

  filename         = var.filename
  source_code_hash = filesha256(var.filename)
  handler          = "Bref\\LaravelBridge\\Http\\OctaneHandler"
  runtime          = var.lambda_runtime
  function_name    = "${var.app_name}-web"
  memory_size      = 1024
  timeout          = 28
  architectures    = ["arm64"]
  role             = aws_iam_role.lambda_execution.arn
  layers           = [var.php_lambda_layer_arn]

  environment {
    variables = merge(local.lambda_function_environment_variables, {
      BREF_LOOP_MAX                    = "250"
      OCTANE_PERSIST_DATABASE_SESSIONS = "1"
    })
  }

  # 要掛載 EFS，Lambda 必須放在 VPC 底下
  vpc_config {
    subnet_ids         = [aws_subnet.private.id]
    security_group_ids = [aws_security_group.egress_only.id]
  }

  # 掛載 EFS，注意掛載路徑必須是 /mnt 開頭
  file_system_config {
    arn              = aws_efs_access_point.access_point_for_lambda.arn
    local_mount_path = "/mnt/efs"
  }
}
```

這樣 Lambda 中的 `/mnt/efs` 就會掛載到 EFS 中的 `/lambda`。

## EFS 支援 SQLite

因為 EFS 支援 NFSv4，所以可以在上面使用 SQLite。
讀多寫少的小網站完全可以考慮 EFS + SQLite 的方式來代替一般的資料庫。

## 參考資料

- [Wikipedia - 亞馬遜彈性檔案系統](https://zh.wikipedia.org/zh-tw/%E4%BA%9A%E9%A9%AC%E9%80%8A%E5%BC%B9%E6%80%A7%E6%96%87%E4%BB%B6%E7%B3%BB%E7%BB%9F)
- [Wikipedia - 網路檔案系統](https://zh.wikipedia.org/zh-tw/%E7%BD%91%E7%BB%9C%E6%96%87%E4%BB%B6%E7%B3%BB%E7%BB%9F)
- [Mounting on Amazon EC2 Linux instances using the EFS mount helper](https://docs.aws.amazon.com/efs/latest/ug/mounting-fs-mount-helper-ec2-linux.html)
- [Amazon Elastic File System (Amazon EFS) Now Supports NFSv4 Lock Upgrading and Downgrading](https://aws.amazon.com/about-aws/whats-new/2017/03/amazon-elastic-file-system-amazon-efs-now-supports-nfsv4-lock-upgrading-and-downgrading/)
