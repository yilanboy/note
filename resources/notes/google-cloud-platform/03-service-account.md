# Service Account

Service Account 有點類似 Azure 的 Managed Identity。
你可以建立一個 Service Account，並且賦予他相關資源的權限，
然後你的程式就可以透過這個 Service Account 來存取 Google Cloud 的資源。

例如，我有一個 BigQuery 的資料集 (Dataset)，我可以建立一個 Service Account，
並賦予他擁有這個資料集的 DataEditor 權限，讓 Fluent Bit 可以透過這個 Service Account，將資料寫入 BigQuery。

> 根據情況，官方會更建議使用 [Workload Identity Federation](./04-workload-identity-federation.md) 來取得短期的權限（Keyless）。

## 使用 Terraform 建立一個 Service Account

```hcl
resource "google_service_account" "access_big_query" {
  account_id   = "accessbigquery"
  display_name = "Access Big Query"
}

resource "google_service_account_key" "mykey" {
  service_account_id = google_service_account.access_big_query.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}
```

## 使用 Terraform 賦予 Service Account 權限

以 BigQuery 為例，我們可以透過 `google_bigquery_dataset_iam_binding` 來賦予 Service Account 權限。

```hcl
resource "google_bigquery_dataset_iam_member" "editor" {
  dataset_id = google_bigquery_dataset.default.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${google_service_account.access_big_query.email}"
}
```

## 產出 credentials.json

你可以產出一個 credentials.json，然後讓你的程式中使用這個檔案來取得權限，並以此操作雲端資源。

```bash
gcloud iam service-accounts keys create KEY_FILE \
    --iam-account=SERVICE_ACOUNT_NAME@PROJECT_ID.iam.gserviceaccount.com
```

## 參考資料

- [Create and delete service account keys](https://cloud.google.com/iam/docs/keys-create-delete)
