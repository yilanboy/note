---
layout: default
parent: Python
nav_order: 3
---

# JSON Schema

JSON Schema 是一個可以用來檢查 JSON 格式是否符合預期的套件。

## 安裝

```bash
pip install jsonschema
```

## 基本使用

使用 `validate` 函式來檢查資料是否符合 Schema。

```python
from jsonschema import validate, ValidationError

schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "number"},
    },
}

data = {
    "name": "Allen",
    "age": 30,
}

try:
    validate(instance=data, schema=schema)
    print("Validation successful")
except ValidationError as e:
    print(f"Validation failed: {e}")
```

## 定義 Schema

### 檢查字串與數字 (String and Number)

- `type`: 指定資料型態，如 `"string"`, `"integer"`, `"number"` (包含整數與浮點數)。
- 字串可以使用 `minLength`, `maxLength`, `pattern` (Regex) 來限制。
- 數字可以使用 `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` 來限制範圍。

```python
schema = {
    "type": "object",
    "properties": {
        "username": {
            "type": "string",
            "minLength": 3,
            "maxLength": 20
        },
        "email": {
            "type": "string",
            "pattern": "^\\S+@\\S+\\.\\S+$"
        },
        "age": {
            "type": "integer",
            "minimum": 0,
            "maximum": 120
        },
        "score": {
            "type": "number",
            "minimum": 0.0,
            "maximum": 100.0
        }
    }
}
```

### 檢查列表 (List)

- `type`: 設定為 `"array"`。
- `items`: 定義列表內元素的 Schema。

```python
schema = {
    "type": "object",
    "properties": {
        "tags": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "scores": {
            "type": "array",
            "items": {
                "type": "integer"
            },
            "minItems": 1,
            "maxItems": 10,
            "uniqueItems": True
        }
    }
}
```

### 檢查物件 (Object)

- `type`: 設定為 `"object"`。
- `properties`: 定義物件內各個屬性的 Schema。

```python
schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer"},
        "email": {"type": "string"}
    }
}
```

### 定義必填欄位 (Required)

- `required`: 一個包含必填欄位名稱的列表。必須定義在該欄位所屬的物件層級。

```python
schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "email": {"type": "string"},
        "age": {"type": "integer"}
    },
    "required": ["name", "email"]
}
```

### 巢狀物件 (Nested Object)

可以將上述概念組合，定義多層次的巢狀結構。

```python
schema = {
    "type": "object",
    "properties": {
        "id": {"type": "integer"},
        "user": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "string"}
            },
            "required": ["name"]
        }
    },
    "required": ["id", "user"]
}
```


## 參考資料

- [jsonschema](https://python-jsonschema.readthedocs.io/en/stable/)