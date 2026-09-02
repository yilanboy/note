# Laravel 中的 Action Pattern

本篇為 Nuno Maduro (Laravel 核心團隊成員) 的影片 [The Action Pattern Is Key to Clean Code](https://www.youtube.com/watch?v=k_gMfdpSXQE) 的學習筆記，介紹了 Action Pattern 的核心概念、為什麼它能讓程式碼更乾淨，以及在 Laravel 開發中的最佳實踐。

## 什麼是 Action Pattern？

- **歷史脈絡**：Action Pattern 起源於 10 年前 Taylor Otwell 稱之為「Self-handling Command Bus」的概念。它是 Command Bus Pattern（包含 Command 數據載荷與 Handler 處理邏輯）的簡化版。
- **核心概念**：傳統的 Command Bus 將資料與邏輯拆分成兩個類別，而在實際開發中通常是一對一的關係。因此，Action Pattern 將 Command 與 Handler 合併在一個單一的類別中，專門負責系統中的**單一業務操作**（例如 `CreateUserAction`、`UpdateUserAction`）。

---

## Action Pattern 在 Controller 中的基本用法

透過 Laravel 的依賴注入（Dependency Injection），我們可以直接在 Controller 方法中注入 Action 類別，並搭配 Form Request 來處理 HTTP 請求的驗證。

### 控制器範例

```php
namespace App\Http\Controllers;

use App\Actions\UpdateUserAction;
use App\Http\Requests\UpdateUserRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

class ProfileController extends Controller
{
    public function update(
        UpdateUserRequest $request,
        UpdateUserAction $updateUser,
        #[CurrentUser] User $user
    ): RedirectResponse {
        // 僅將驗證過的資料傳入 Action，不傳入 HTTP Request 相關物件
        $updateUser->handle($user, $request->validated());

        return redirect()->back()->with('success', 'Profile updated!');
    }
}
```

> **關於 `#[CurrentUser]` 屬性**：
> 這是 Laravel 近期版本中提供的一個非常實用的屬性（Attribute）。它可以自動注入當前登入的使用者模型，避免了寫出繁瑣的 `$request->user()` 或 `Auth::user()`，讓方法簽名更加直觀。

---

## 核心設計原則與最佳實踐

### 1. 隔離 HTTP 關注點（Context-free / 無上下文）

Action 不應該包含任何 HTTP 特有的邏輯或物件（例如 `Request` 類別、Session 寫入、重新導向等）。它應該是「無上下文」的，只接收已經驗證好的陣列（或 DTO）以及 Eloquent 模型。

- **為什麼？** 這樣可以確保 Action 能夠在其他層級被重複使用，例如 Console 命令（Artisan Commands）、佇列任務（Queued Jobs）或是測試中。
- **如何劃分邊界？** 以「刪除帳號」為例：
    - **Action 的範疇**：刪除使用者的歷史紀錄、刪除資料庫中的 User 資料、發送 goodbye 電子郵件。
    - **Controller 的範疇**：登出使用者（`Auth::logout()`）、失效 Session（`$request->session()->invalidate()`）與重新生成 CSRF Token。因為登出與 Session 操作是逆向的 HTTP 層級的關注點。

### 2. 資料驗證的邊界

Action 本身**不應該**負責資料的驗證。它應該假定傳入的資料在到達 Action 之前就已經被完全驗證過了。

- 所有的驗證邏輯（如信箱格式、唯一性、字串長度限制等）應全部寫在 Form Request 中。
- 如果驗證失敗，Laravel 會自動在進入控制器前就中斷請求，因此 Action 不必擔心收到無效或不安全的資料。

### 3. 資料庫事務（Database Transactions）的重要性

當一個 Action 涉及多個資料庫操作或外部副作用（Side-effects）時（例如更新使用者的同時，需要寫入活動紀錄與發送郵件），忘記使用資料庫事務（DB Transaction）是一個常見的 Bug。

- **解決方案**：在 Action 內使用 `DB::transaction` 確保操作的原子性（Atomicity）。如果寫入活動紀錄或後續操作失敗，前面的資料庫修改會自動回滾，系統不會處於不一致狀態。

### 4. 依賴注入與 Action 組合（Composition）

Action 的另一個強大之處在於它們可以輕易地被重用與組合。你可以透過建構子將其他 Action 注入到當前的 Action 中。

```php
namespace App\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UpdateUserAction
{
    // 注入另一個 Action 用於建立活動紀錄
    public function __construct(
        private CreateActivityAction $createActivity
    ) {}

    /**
     * @param array{name: string, email: string} $data
     */
    public function handle(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $user->update($data);

            // 呼叫另一個 Action
            $this->createActivity->handle($user, 'profile_updated');

            return $user;
        });
    }
}
```

> Laravel 支援嵌套事務（Nested Transactions），因此在 Action 組合呼叫時，資料庫事務能完美地在不同層級間傳播，無需擔心衝突。

---

## Action 的參數設計：Array 還是 DTO？

在傳遞資料給 Action 時，通常有兩種常見做法：

1.  **DTO (Data Transfer Object)**：
    - _優點_：強型別、在 IDE 中有極佳的程式碼提示與補全。
    - _缺點_：每個 Action 都需要建立一個額外的 DTO 類別，容易導致專案檔案數量過多。
2.  **Array shapes (陣列形狀)**：
    - _優點_：輕量，不需建立額外檔案，藉由 PHPStan 提供的 `@param array{...}` 註解即可支援靜態分析與型別提示。
    - _做法_：
        ```php
        /**
         * @param array{name: string, email: string} $data
         */
        public function handle(User $user, array $data): void
        ```

這兩者都是被廣泛採用的做法，可根據團隊對型別嚴格度與專案結構簡潔度來做選擇。

---

## Actions 檔案的存放位置

許多開發者在專案變大時會考慮使用複雜的模組化目錄結構（例如 `app/Actions/User/...`）。

Nuno Maduro 推薦採用**平坦的資料夾結構**，即全部存放在 `app/Actions/` 底下：

- 例如：`CreateUserAction.php`、`UpdateUserAction.php`、`DeleteUserAction.php` 等。
- 即使專案長大到有超過 100 個 Action，在單一資料夾中直接搜尋也比在繁複的目錄樹中切換來得更加直觀。

---

## 模式對比與總結

### Action Pattern vs. Events & Observers

| 特性           | Action Pattern                                           | Events & Observers                                                                             |
| :------------- | :------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **明確度**     | **高** (Explicit)。在控制器中一目了然呼叫了什麼 Action。 | **低** (Implicit)。事件發送後，背後觸發了什麼監聽器（Listeners）不易追蹤。                     |
| **副作用控制** | **容易**。所有步驟都包裝在 handle 方法中。               | **困難**。在執行 Migration 或背景 Task 時，可能會意外觸發 Observer，發送郵件或做其他不當修改。 |

### Actions (寫入) vs. Queries (讀取)

- **Actions** 通常用於**寫入/變更系統狀態（Write Operations）**。
- 對於**讀取/查詢（Read Operations）**（例如獲取產品列表）：
    - 部分開發者會使用 `ListProductsAction`。
    - 部分開發者會建立 `app/Queries` 資料夾（如 `ListProductsQuery.php`）。
    - 部分開發者則偏好直接在 Controller 中寫 inline query（例如 `Product::latest()->get()`）。
    - 這部分業界尚無統一標準，可依專案複雜度調整。
