---
layout: default
parent: Ansible
nav_order: 6
---

# Set Fact Module

`set_fact` 可以讓你在 Ansible Playbook 中定義和設置變量。這些變量在 Playbook 的後續任務中可用，並且在整個 Playbook 執行期間保持不變。

## 使用範例

以下是一個使用 `set_fact` 的簡單範例：

```yaml
- name: Example of set_fact
  hosts: localhost
  tasks:
    - name: Set a variable using set_fact
      ansible.builtin.set_fact:
        my_variable: "Hello, World!"

    - name: Display the variable
      ansible.builtin.debug:
        msg: "{{ my_variable }}"
```

在這個範例中，我們使用 `set_fact` 定義了一個名為 `my_variable` 的變量，並將其值設置為 `"Hello, World!"`。隨後，我們使用 `debug` 模組輸出該變量的值。

## 用來取得 API 回傳的資料，並轉成 JSON 格式

```yaml
- name: Example of set_fact to get API data
  hosts: azure_vm_1
  tasks:
    - name: Get metadata from Azure Instance Metadata Service
      ansible.builtin.uri:
        url: "http://169.254.169.254/metadata/instance?api-version=2021-02-01"
        method: GET
        return_content: true
        use_proxy: false
        headers:
          Metadata: true
      register: metadata

    - name: Convert response to JSON format and set variable
      ansible.builtin.set_fact:
        metadata: "{{ metadata.content | to_json | from_json }}"

    - name: display metadata
      ansible.builtin.debug:
        var: metadata.compute
```

這裡 `to_json` 和 `from_json` 為 Ansible 的過濾器（filter），可以用來將字串轉成 JSON 格式。

## 參考資料

- [ansible.builtin.set_fact module](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/set_fact_module.html)
- [Using filters to manipulate data](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_filters.html)
