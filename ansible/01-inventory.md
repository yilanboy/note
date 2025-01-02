---
layout: default
parent: Ansible
nav_order: 1
---

# Inventory

Ansible 的 inventory 是一個用來定義主機連線資訊的清單。你可以在 inventory 中設定主機的 IP 位址、使用者名稱、密碼、SSH 金鑰等等。Ansible 會根據 inventory 的設定來連線主機並且執行指令。

Ansible 是 **Agentless** 的，不需要在主機上安裝任何 agent。只要主機上有**安裝 Python** 與可以使用 SSH 連線即可。

## Inventory 的格式

Ansible 的 inventory 有兩種格式，一種是 INI 格式，另一種是 YAML 格式。

### INI

INI 格式的 inventory 範例：

```ini
[webservers]
web  ansible_host=foo.example.com ansible_connection=ssh ansible_user=ubuntu ansible_password=ubuntu
web2 ansible_host=bar.example.com ansible_connection=winrm ansible_user=win ansible_password=win

[dbservers]
db1 one.example.com ansible_connection=ssh ansible_user=ubuntu ansible_password=ubuntu
db2 two.example.com ansible_connection=ssh ansible_user=ubuntu ansible_password=ubuntu

localhost ansible_connection=local
```

每個 section (例如 `[webservers]`) 的名稱都是一個 group，每個 group 裡面的每一行都是一個 host (例如 `web` 與 `web2`)。

Inventory 中的每個 host 都可以設定下面的參數：

- ansible_host: 主機的 IP 位址
- ansible_port: SSH 連線的 port，預設為 22
- ansible_user: SSH 連線的使用者名稱，預設為當前使用者
- ansible_ssh_pass: SSH 連線的密碼，**正式環境建議使用 SSH 金鑰登入**
- ansible_ssh_private_key_file: SSH 連線的金鑰檔案路徑
- ansible_connection: 連線的方式，預設為 smart，可以設定為 ssh、local 或是 winrm

### YAML

YAML 格式的 inventory 範例如下：

```yaml
ungrouped:
  hosts:
    web:
      ansible_host: foo.example.com
      ansible_connection: ssh
      ansible_user: ubuntu
      ansible_password: ubuntu
    web2:
      ansible_host: bar.example.com
      ansible_connection: winrm
      ansible_user: win
      ansible_password: win
web_server:
  hosts:
    web:
      ansible_host: foo.example.com
      ansible_connection: ssh
      ansible_user: ubuntu
      ansible_password: ubuntu
```

Ansible 預設會有 `all` 與 `ungrouped` 兩個 group，`all` 代表所有的 host，`ungrouped` 代表沒有被分到任何 group 的 host。

因為 YAML 格式階層分明，我個人比較喜歡使用 YAML 格式的 inventory。

## 如何使用 Inventory

可以建立一個 `inventory.ini` 檔案，並且加入下面的內容：

```ini
[web_servers]
web  ansible_host=foo.example.com ansible_connection=ssh ansible_user=ubuntu ansible_password=ubuntu
```

並使用以下的指令測試連線是否成功：

```bash
ansible web_servers -i inventory.ini -m ping
```

`web_servers` 是 inventory 中的 group 名稱，你可以輸入 host 名稱，也可以使用 `all` 來指定所有的 host。

`-i` 參數用來指定 inventory 的檔案路徑。

`-m` 代表要執行的模組，這裡使用的是 `ping` 模組。

## 搭配 SSH Config

應該有很多人會透過設定 SSH Config `~/.ssh/config` 來管理 SSH 的連線設定。

Ansible 是可以與 SSH Config 一起使用的，假設我們有一個 SSH Config 如下：

```ini
Host foo
  HostName foo.example.com
  User ubuntu
  Port 22
  IdentityFile ~/.ssh/id_rsa
```

你只需要在 inventory 中設定：

```ini
[web_servers]
foo
```

就可以使用 Ansible 連線到 `foo.example.com` 了。

```bash
ansible foo -i inventory.txt -m ping
```

這樣在 inventory 中就不需要設定 `ansible_host`、`ansible_user`、`ansible_port` 與 `ansible_ssh_private_key_file` 這些參數了。

## 使用 ansible.cfg

你可以在與 inventory 同一目錄底下建立一個 `ansible.cfg` 檔案，這個檔案可以用來設定 Ansible 的一些參數。
例如 inventory 的檔案位置。

```ini
[defaults]
inventory = inventory.ini
```

這樣你就不需要在指令中加入 `-i inventory.ini` 了。

```bash
ansible web_servers -m ping
```
