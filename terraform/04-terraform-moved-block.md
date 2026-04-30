---
layout: default
parent: Terraform
nav_order: 4
---

# 使用 Terraform `moved` Block 重新命名資源

## 簡介

`moved` block 是 Terraform 1.1+ 提供的宣告式語法，用於通知 Terraform 某個資源的「位址」（資源類型 + 名稱，或再加上模組路徑）已經變更，但底層真實的基礎設施並未改變。Terraform 會自動將 state 中舊位址下的資源紀錄遷移到新位址，避免不必要的銷毀與重建。

## 為什麼需要

Terraform 以「位址」（例如 `aws_subnet.public`）作為 state 中識別資源的鍵。若你只是把 `.tf` 檔案中的資源重新命名（例如改為 `aws_subnet.first_public`），Terraform 會視為：

- 舊資源 `aws_subnet.public` 已不存在於配置 → 應銷毀
- 新資源 `aws_subnet.first_public` 不存在於 state → 應建立

結果就是真實基礎設施被銷毀重建，造成服務中斷與資料遺失。`moved` block 即用來解決此問題。

## `moved` block vs `terraform state mv`

| 項目             | `moved` block                      | `terraform state mv`           |
| ---------------- | ---------------------------------- | ------------------------------ |
| 形式             | 宣告式（寫在 `.tf` 中）            | 命令式（CLI 操作）             |
| 是否進入版本控制 | 是                                 | 否（CLI 操作不會留在 repo 中） |
| 團隊協作         | 任何人 pull 後跑 plan/apply 即生效 | 每位成員都需手動執行命令       |
| 推薦場景         | 一般情境                           | 例外情境（如跨 state 檔搬移）  |

**通常推薦使用 `moved` block。**

## 使用步驟

1. 在任一 `.tf` 檔案中（建議單獨開一個 `moved.tf`，方便事後清理）加入 `moved` block：

   ```hcl
   moved {
     from = <舊位址>
     to   = <新位址>
   }
   ```

2. 修改 `.tf` 檔案中的資源宣告名稱，並更新**所有內部引用**。
3. 執行 `terraform validate` 確認語法正確。
4. 執行 `terraform plan`，預期看到 `n to move, 0 to add, 0 to change, 0 to destroy`。
5. 若 plan 結果符合預期，執行 `terraform apply`。
6. apply 完成後，`moved` block 已成為 no-op，可在後續 commit 中刪除（保留也可，僅是冗餘）。

## 實際範例

假設原有以下資源：

```hcl
resource "aws_subnet" "public" {
  vpc_id = aws_vpc.main.id
  # ...
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}
```

要將 `aws_subnet.public` 重新命名為 `aws_subnet.first_public`：

**步驟 1：新增 `moved.tf`**

```hcl
moved {
  from = aws_subnet.public
  to   = aws_subnet.first_public
}
```

**步驟 2：修改資源宣告**

```hcl
resource "aws_subnet" "first_public" {  # 原本為 "public"
  vpc_id = aws_vpc.main.id
  ...
}
```

**步驟 3：更新所有引用該資源的位置**

```hcl
resource "aws_route_table_association" "first_public" {
  subnet_id      = aws_subnet.first_public.id   # 引用已更新
  route_table_id = aws_route_table.public.id
}
```

**步驟 4：更新 `output`（output 名稱保持不變，以維持下游 stack 的契約）**

```hcl
output "public_subnet_id" {              # output 名稱不變
  value = aws_subnet.first_public.id     # 引用更新
}
```

**步驟 5：執行 plan 與 apply**

```bash
terraform plan     # 預期：1 to move，0 to add/change/destroy
terraform apply
```

## 注意事項

- `moved` block 中的 `from` 必須是**仍存在於 state 中**的舊位址；若 state 中已無該資源，plan 會報錯。
- 若同時重新命名多個彼此引用的資源，**每個都需要各自的 `moved` block**，不能省略。
- `moved` block 也可跨模組搬移資源，例如從根模組搬入子模組：

  ```hcl
  moved {
    from = aws_instance.nat
    to   = module.network.aws_instance.nat
  }
  ```

- 重新命名**只是改變 Terraform 的識別位址**，不會更動 AWS 端的實體屬性（例如 Name tag）。若想同步更新 Name tag，需另外修改 `tags` 區塊；這是真實異動，會被 plan 反映出來。

## 清理

apply 成功後：

- `moved` block 已完成任務，可以安全刪除。
- 刪除後再次執行 `terraform plan`，應顯示 `No changes`。
- 若使用 S3 + DynamoDB 共享 backend，任何人 apply 後 state 即同步，可立即刪除 `moved.tf`；若是個人 local state 或非共享 backend，建議等所有成員都 apply 過後再刪除。
