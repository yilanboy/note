---
layout: default
parent: Ansible
nav_order: 5
---

# Handlers

在 Ansible 中，你可以根據狀態是否變化，來觸發一些額外的操作。

## 範例

```yaml
---
- name: Example of no-handler rule
  hosts: localhost
  tasks:
    - name: Register result of a task
      ansible.builtin.lineinfile:
        dest: "/tmp/example.txt"
        line: "Hi from Ansible!"
      check_mode: true # 根據檔案是否有 Hi from Ansible! 字串回傳 changed 屬性（沒有的話回傳 true）
      notify: # 如果 changed 屬性為 true 則依序執行下面兩個操作
        - Second command to run
        - Third command to run

  handlers:
    - name: Second command to run
      ansible.builtin.debug:
        msg: The placeholder file was modified!

    - name: Third command to run
      ansible.builtin.debug:
        msg: The placeholder file was modified!
```

## 參考資料

- [Handlers: running operations on change](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_handlers.html#handlers)
- [Ansible Lint - no-handler](https://ansible.readthedocs.io/projects/lint/rules/no-handler/)
