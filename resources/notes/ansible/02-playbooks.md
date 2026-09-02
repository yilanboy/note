# Playbooks

Ansible playbooks 提供了一個更進階的方式來管理主機上的設定，它是一個 YAML 格式的檔案。

你可以使用 playbooks 在多台主機上執行一系列有順序性的任務，例如安裝套件、設定檔案、啟動服務等等。

以下是一個簡易的 playbooks 範例：

```yaml
# playbook.yml
- name: update apt packages
  hosts: web_servers
  become: true
  tasks:
      - name: Update all packages to their latest version
        ansible.builtin.apt:
            name: '*'
            state: latest

- name: Install nginx and start it
  hosts: web_servers
  become: true
  tasks:
      - name: Install nginx
        ansible.builtin.apt:
            name: nginx
            state: present

      - name: Copy local nginx config to remote
        ansible.builtin.copy:
            src: nginx.conf
            dest: /etc/nginx/nginx.conf
            mode: '0644'

      - name: Start nginx
        ansible.builtin.service:
            name: nginx
            state: started
```

`hosts` 為定義在 inventory 檔案中的 host 或是 group。如果是 group 的話，Ansible 會依序對 group 中的每一個 host 執行任務。

`ansible.builtin.apt`、`ansible.builtin.copy` 與 `ansible.builtin.service` 是 Ansible 的模組，這種寫法被稱為 FQCN (Fully Qualified Collection Name)，可以避免模組名稱衝突的問題。

> 在使用模組時，盡量使用 fqcn 的寫法，例如 `ansible.builtin.copy` 而不是 `copy`。

模組 `ansible.builtin.apt` 底下的 `name` 與 `state` 為模組的參數，不同的模組會有不同的參數，可以參考官方文件了解其使用方式。

## 執行 Playbook

當 yaml 檔案設定好之後，可以使用 `ansible-playbook` 指令來執行 playbook：

```bash
ansible-playbook playbook.yml -i inventory.ini
```

`-i` 參數用來指定 inventory 的檔案路徑。

## 參考資料

- [Ansible Lint Document - FQCN](https://ansible.readthedocs.io/projects/lint/rules/fqcn/)
- [Ansible Document - apt Module](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/apt_module.html)
- [Ansible Document - Copy Module](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/copy_module.htmll)
- [Ansible Document - Service Module](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/service_module.html)
