# Code Blocks Testing

This note contains code blocks in various programming languages for testing highlighting and toolbar features.

## PHP Code Block

```php
namespace App\Http\Controllers;

class UpdateUserAction
{
    public function execute(): void
    {
        // action logic
    }
}
```

## Unlisted Language Block

```unknown
composer require nunomaduro/larastan
includes:
    - phpstan.neon
```

## Rust Code Block

```rust
fn main() {
    println!("cargo new my_project");
}
```

## Dockerfile Block

```dockerfile
FROM php:8.4-cli
WORKDIR /var/www/html
COPY . .
```

## Neon Block

```neon
parameters:
    paths:
        - app
    level: 5
    title: Larastan
```

## Nonsupport Block

```nonsupport
This is nonsupport language
```
