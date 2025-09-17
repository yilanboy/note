---
layout: default
parent: Ansible
nav_order: 7
---

# Template Module

Ansible 的 Template 套件支援使用 Jinja Template，可以動態生成配置檔案。

## 基本用法

Template 模組將 Jinja2 模板檔案轉換為目標主機上的檔案。

### 簡單範例

新增一個 `templates` 資料夾，並在其底下建立模板檔案 `nginx.conf.j2`：

```jinja2
server {
    listen {{ nginx_port | default(80) }};
    server_name {{ server_name }};

    location / {
        root {{ web_root }};
        index index.html;
    }
}
```

在 Playbook 中使用 template 模組：

```yaml
- name: Deploy website nginx config
  ansible.builtin.template:
    src: ./templates/nginx.conf.j2
    dest: /etc/nginx/sites-available/{{ server_name }}
    owner: root
    group: root
    mode: "u=rw,g=r,o=r"
  vars:
    nginx_port: 8080
    server_name: example.com
    web_root: /var/www/html
  notify: restart nginx
```

## 常用參數

- `src`: 模板檔案路徑（相對於 templates/ 目錄）
- `dest`: 目標檔案路徑
- `owner`: 檔案擁有者
- `group`: 檔案群組
- `mode`: 檔案權限
- `backup`: 是否備份原檔案（true/false）

## Jinja2 語法重點

- `{{ variable }}`: 輸出變數值
- `{% if condition %}...{% endif %}`: 條件判斷
- `{% for item in list %}...{% endfor %}`: 迴圈
- `{{ variable | default('default_value') }}`: 設定預設值
