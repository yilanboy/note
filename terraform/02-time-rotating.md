---
layout: default
parent: Terraform
nav_order: 2
---

# Time Rotating

Terraform 中有提供一個叫做 `time_rotating` 的資源，讓你可以超過一定時間後，重新部署資源。

```hcl
resource "time_rotating" "rotate_every_15_days" {
  rotation_days = 15
}
```

假設你想要讓 IAM Access Key 超過 15 天後就重新建立，就可以在 `lifecycle` 設定超過天數就重新建立。

```hcl
resource "aws_iam_access_key" "example" {
  user = aws_iam_user.example.name

  lifecycle {
    replace_triggered_by = [time_rotating.rotate_every_15_days.rotation_rfc3339]
  }
}
```
