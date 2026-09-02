# Defining Outputs for Jobs

如果你想設定一個變數讓後續的 Job 使用，可以使用 GitHub Action 提供的 `GITHUB_OUTPUT` 環境變數。

## 範例

```yaml
jobs:
    get-the-version-number-from-tag-name:
        name: Get the version number from tag name
        runs-on: ubuntu-latest
        # 3. 根據 step id 抓取 output
        outputs:
            version: ${{ steps.get-the-version-number.outputs.version }}
        steps:
            - name: Get the version number from tag name
              # 1. 需要在 step 上設定 id
              id: get-the-version-number
              # 2. 將變數設定放入 GITHUB_OUTPUT
              run: |
                  echo "version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

    print-the-version-number:
        needs: get-the-version-number-from-tag-name
        name: Print the version number
        runs-on: ubuntu-latest
        env:
            APP_VERSION: ${{ needs.get-the-version-number-from-tag-name.outputs.version }}
        steps:
            - name: Print the version number
              run: |
                  echo ${{ env.APP_VERSION }}
```

## 參考資料

- [Defining Outputs for Jobs](https://docs.github.com/en/actions/using-jobs/defining-outputs-for-jobs)
