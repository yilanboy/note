# Variables

在 playbook 中可以使用 `vars` 來定義變數，例如：

```yaml
# playbook.yml
- name: update apt packages
  hosts: web_servers
  become: true
  vars:
      package_name: nginx
  tasks:
      - name: install nginx
        ansible.builtin.apt:
            name: '{{ package_name }}'
            state: present
```

你也可以在 inventory 中設定要給 host 使用的變數，例如：

```ini
web_server http_port=80 https_port=443
```

然後在 playbook 中使用 `package_name` 來取得變數，例如：

```yaml
# playbook.yml
- name: Set Firewall Configurations
  hosts: web_server
  tasks:
      - name: Allow HTTP
        community.general.ufw:
            rule: allow
            port: '{{ http_port }}'
            proto: tcp

      - name: Allow HTTPS
        community.general.ufw:
            rule: allow
            port: '{{ https_port }}'
            proto: tcp
```

更好的方式，你也可以創建一個與 host 名稱相同的檔案，例如 `web_server.yaml`，然後在檔案中定義變數，例如：

```yaml
# web_server.yaml
http_port: 80
https_port: 443
```

變數是可以與其他字串結合的，例如：

```yaml
# playbook.yml
- name: do not permit traffic in default zone on port 80/tcp
  ansible.posix.firewalld:
      port: '{{ http_port }}/tcp'
      permanent: true
      state: disabled
```
