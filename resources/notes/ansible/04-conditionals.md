# Conditionals

Ansible 提供控制流程，可以讓你根據條件來決定是否執行某個任務。

## when

`when` 可以用來設定條件，當條件成立時，才會執行任務。

以下是一個簡單的範例：

```yaml
- name: Install Nginx
  hosts: web_servers
  become: true
  tasks:
      - name: Install Nginx on Ubuntu
        ansible.builtin.apt:
            name: nginx
            state: latest
        when: ansible_distribution == 'Ubuntu'

      - name: Install Nginx on CentOS
        ansible.builtin.yum:
            name: nginx
            state: latest
        when: ansible_distribution == 'CentOS'
```

### or 與 and

`or` 與 `and` 可以用來組合多個條件，例如：

```yaml
- name: Install Nginx
  hosts: web_servers
  become: true
  tasks:
      - name: Install Nginx on Ubuntu
        ansible.builtin.apt:
            name: nginx
            state: latest
        when: ansible_distribution == "Ubuntu" or ansible_distribution == "Debian"

      - name: Install Nginx on CentOS
        ansible.builtin.yum:
            name: nginx
            state: latest
        when: ansible_distribution == "CentOS" or ansible_distribution == "RedHat"
```

## loop

`loop` 可以用來迭代一個 list，例如：

```yaml
- name: Install packages
  hosts: web_servers
  become: true
  tasks:
      - name: Install packages
        ansible.builtin.apt:
            name: '{{ item }}'
            state: latest
        loop:
            - nginx
            - apache2
            - php
```

你可以結合剛剛的 `when` 一起使用，例如：

```yaml
- name: Install Software
  hosts: all
  vars:
      - packages:
            - name: nginx
              required: true
            - name: apache2
              required: false
            - name: php
              required: true
  tasks:
      - name: Install  "{{ item.name }}"
        ansible.builtin.apt:
            name: '{{ item.name }}'
            state: latest
        loop: '{{ packages }}'
        when: item.required == true
```

## register

`register` 可以將執行任務後的輸出結果存到變數中，例如：

```yaml
- name: Check status of a service and email if its down
  hosts: localhost
  tasks:
      - ansible.builtin.command: service httpd status
        register: result

      - community.general.mail:
            to: example@mail.com
            subject: 'Service is down'
            body: '{{ result.stdout }}'
        when: result.stdout.find('down') != -1
```
