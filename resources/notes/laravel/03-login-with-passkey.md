# 在 Laravel 中實作密碼金鑰登入

這篇文章接續我的上一篇文章 — [實作密碼金鑰登入的筆記](https://docfunc.com/posts/169/實作密碼金鑰登入的筆記-post)。
建議先閱讀完上一篇文章了解密碼金鑰的基本概念與專有名詞後，再來閱讀本篇文章，相信你會更好的理解文章中的實作內容 😊。

接下來會一步一步的說明如何在 Laravel 中實作密碼金鑰登入。

## 密碼金鑰的註冊與驗證流程

在開始實作之前，我們再來複習一下密碼金鑰的註冊與身分驗證流程。

### 註冊密碼金鑰的流程

1. 前端向後端取得**憑證建立選項（Credential Creation Options）**，開始註冊流程。
2. 前端使用 WebAuthn API 呼叫驗證裝置，讓裝置根據資料產生一組金鑰對：公開金鑰憑證與私密金鑰。
3. 前端會將新出爐的憑證傳送至後端。
4. 後端會對憑證進行**證明（Attestation）**，如果證明通過，會將憑證與相關資訊儲存在資料庫中，以供未來驗證用戶身份時使用。

### 身分驗證的流程

1. 前端向後端取得**憑證請求選項（Credential Request Options）**，開始身分驗證程流程。
2. 前端使用 WebAuthn API 呼叫驗證裝置，讓裝置使用儲存在其中的私鑰，根據資料產生公開金鑰憑證。
3. 前端將憑證傳送至後端。
4. 後端會對憑證進行**斷言（Assertion）**，並檢查憑證是否存在於資料庫中，如果存在就將對應的用戶進行登入。

## 安裝後端與前端的軟體套件

因為密碼金鑰的實作相當複雜，比較建議使用別人寫好的軟體套件來進行開發，除了可以減少大量的開發時間，還可以避免因為標準實作不完全而導致的資安問題。本篇文章會使用 [SimpleWebAuthn](https://simplewebauthn.dev/) 與 [WebAuthn Framework](https://webauthn-doc.spomky-labs.com/) 這兩個前後端套件。

使用 npm 與 composer 分別安裝這兩個套件。

```bash
# 前端需要的套件
npm install -D @simplewebauthn/browser

# 後端需要的套件
compsoer require web-auth/webauthn-lib
```

> 如果想找非 PHP 語言的密碼金鑰套件，可以參考 [Awesome WebAuthn](https://github.com/yackermann/awesome-webauthn) 這個 GitHub 專案。上面有很多由社群精選的密碼金鑰套件。

### 使用 Vite 打包前端套件

在 resources/ts 資料夾下建立一個檔案 `webauthn.ts`，將需要用到的 SimpleWebAuthn 函式放入 `window` 物件，使其成為全域函式，方便之後在前端頁面上呼叫使用。

```typescript
import {
    browserSupportsWebAuthn,
    startAuthentication,
    startRegistration,
} from '@simplewebauthn/browser';

declare global {
    interface Window {
        browserSupportsWebAuthn: Function;
        startAuthentication: Function;
        startRegistration: Function;
    }
}

window.browserSupportsWebAuthn = browserSupportsWebAuthn;
window.startAuthentication = startAuthentication;
window.startRegistration = startRegistration;
```

修改 `vite.config.js`，使用 Vite 打包我們剛剛新增的 `webauthn.ts` 檔案。

```javascript
export default defineConfig({
    plugins: [
        laravel({
            input: [
                // ...
                // 加上剛剛新增的 TypeScript 檔案
                'resources/ts/webauthn.ts',
            ],
            refresh: true,
        }),
        tailwindcss(),
    ],
});
```

使用 `npm` 指令執行打包作業。

```bash
npm run build
```

如此一來，我們就可以在 Blade 樣板中引入前端函式庫。

```blade
@assets
    @vite('resources/ts/webauthn.ts')
@endassets
```

## 建立資料表、模型與關聯

建立一張資料表來儲存密碼金鑰的公開金鑰憑證。使用 `artisan` 指令來建立模型與 Migration 檔案。

```bash
php artisan make:model Passkey --migration

# INFO Model [app/Models/Passkey.php] created successfully.

# INFO Migration [database/migrations/2025_04_15_220034_create_passkeys_table.php] created successfully.
```

在 Migration 檔案中設定資料表欄位。

```php
<?php

public function up(): void
{
    Schema::create('passkeys', function (Blueprint $table) {
        $table->id();

        // 建立一個外鍵 user_id，指向 users 資料表的 id 欄位
        $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
        // 用來識別密碼金鑰的名稱，由用戶自行命名
        $table->text('name');
        // 密碼金鑰的憑證 ID
        $table->text('credential_id');
        // 憑證的相關資訊
        $table->json('data');

        $table->timestamp('last_used_at')->nullable();
        $table->timestamps();
    });

}
```

使用 `artisan` 指令建立資料表。

```bash
php artisan migrate
```

修改密碼金鑰模型 `Passkey.php` 的內容，設定與用戶模型的關聯。

```php
<?php

class Passkey extends Model
{
    use HasFactory;

    // 可寫入的資料表欄位
    protected $fillable = [
        'name',
        'credential_id',
        'data',
        'last_used_at',
    ];

    // 定義資料的型別
    protected $casts = [
        'data' => 'json',
        'last_used_at' => 'datetime',
    ];

    // 建立與用戶資料的關聯
    // 一把密碼金鑰只屬於某一個用戶
    public function user(): belongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

更新用戶模型 `User.php`，加上與密碼金鑰模型的關聯。

```php
<?php

class User extends Authenticatable implements MustVerifyEmail
{
    // ...

    // 建立與密碼金鑰資料的關聯
    // 一位用戶可以有多個密碼金鑰
    public function passkeys(): HasMany
    {
        return $this->hasMany(Passkey::class);
    }
}
```

## 序列化類別

因為註冊密碼金鑰與身分驗證的過程中，資料需要不停的從 JSON 字串與 PHP 物件中反覆橫跳，也就是進行序列化與反序列化，可以將序列化的相關邏輯拉出來單獨寫一個類別。

在 `app/Services` 下建立檔案 `Serializer.php`，寫入以下的內容：

```php
<?php

namespace App\Services;

use Symfony\Component\Serializer\Encoder\JsonEncode;
use Symfony\Component\Serializer\Normalizer\AbstractObjectNormalizer;
use Symfony\Component\Serializer\SerializerInterface;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\Denormalizer\WebauthnSerializerFactory;

class Serializer
{
    // 建立序列化實體
    public static function make(): Serializer
    {
        $attestationStatementSupportManager = AttestationStatementSupportManager::create();

        $serializer = new WebauthnSerializerFactory($attestationStatementSupportManager)
            ->create();

        return new self($serializer);
    }

    public function __construct(
        protected SerializerInterface|NormalizerInterface $serializer,
    ) {}

    // 將傳進來的 PHP 物件轉為 JSON 字串
    public function toJson(mixed $value): string
    {
        return $this->serializer->serialize(
            $value,
            'json',
            [
                AbstractObjectNormalizer::SKIP_NULL_VALUES => true,
                JsonEncode::OPTIONS => JSON_THROW_ON_ERROR,
            ]
        );
    }

    // 將 JSON 字串轉為目標 PHP 物件
    public function fromJson(string $value, string $desiredClass)
    {
        return $this
            ->serializer
            ->deserialize($value, $desiredClass, 'json');
    }

    // 將 PHP 物件轉為陣列
    public function toArray(mixed $value): array
    {
        return $this->serializer->normalize($value, 'json');
    }
}
```

## 客製化的計數器檢查

在註冊密碼金鑰的過程中，會檢查密碼金鑰的[簽名計數器（Signature Counter）](https://www.w3.org/TR/webauthn-2/#sctn-sign-counter)是否有效。這個計數器是用來防止密碼金鑰被複製（Clone）的機制。需要注意的是，有些實體驗證裝置（例如 YubiKey）並沒有實作簽名計數器的功能，所以會無法通過計數器的檢查，導致註冊失敗。

我們可以建立一個客製化的計數器檢查，並修改計數器檢查的規則。在 `app/Services` 底下建立檔案 `CustomCounterChecker.php`，寫上我們的計數器檢查規則：

```php
<?php

namespace App\Services;

use Webauthn\Counter\CounterChecker;
use Webauthn\Exception\CounterException;
use Webauthn\PublicKeyCredentialSource;

class CustomCounterChecker implements CounterChecker
{
    /**
     * @throws CounterException
     */
    public function check(PublicKeyCredentialSource $publicKeyCredentialSource, int $currentCounter): void
    {
        // 計數器在註冊的過程中應該要 +1，但有些驗證裝置並沒有實作計數器功能
        // 這會導致計數器沒有變化，這裡改為大於或等於，意思是計數器沒有 +1 也可以
        if ($currentCounter >= $publicKeyCredentialSource->counter) {
            return;
        }

        throw CounterException::create(
            $currentCounter,
            $publicKeyCredentialSource->counter,
            'Invalid counter.'
        );
    }
}
```

## 提供註冊安全金鑰選項的 API

建立一個單一行為控制器 `GeneratePasskeyRegisterOptionsController.php`。

```bash
php artisan make:controller Api/GeneratePasskeyRegisterOptionsController --invokable
```

這個控制器只做一件事情，就是提供憑證建立選項。

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Serializer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Illuminate\Support\Uri;
use Webauthn\AuthenticatorSelectionCriteria;
use Webauthn\Exception\InvalidDataException;
use Webauthn\PublicKeyCredentialCreationOptions;
use Webauthn\PublicKeyCredentialRpEntity;
use Webauthn\PublicKeyCredentialUserEntity;

class GeneratePasskeyRegisterOptionsController extends Controller
{
    /**
     * @throws InvalidDataException
     */
    public function __invoke(Request $request): string
    {
        // 建立一個信賴方實體
        // id 是網站的網域名稱
        $relatedPartyEntity = new PublicKeyCredentialRpEntity(
            name: config('app.name'),
            id: Uri::of(config('app.url'))->host()
        );

        // 建立一個用戶實體
        // id 必須是唯一的，通常是用戶的 ID 或 UUID
        // 注意！name 不建議使用用戶的敏感資訊，例如 email 或電話號碼
        $userEntity = new PublicKeyCredentialUserEntity(
            name: $request->user()->name,
            id: (string) $request->user()->id,
            displayName: $request->user()->name,
            icon: null
        );

        // 驗證裝置的設定
        // 沒有偏好任何類型的驗證裝置，並且要求使用者的裝置必須支援可探索的憑證
        // 目前可探索的憑證已經是主流，如果這裡沒有強制要求，你的 YubiKey 會無法使用
        $authenticatorSelectionCriteria = AuthenticatorSelectionCriteria::create(
            authenticatorAttachment: AuthenticatorSelectionCriteria::AUTHENTICATOR_ATTACHMENT_NO_PREFERENCE,
            residentKey: AuthenticatorSelectionCriteria::RESIDENT_KEY_REQUIREMENT_REQUIRED,
        );

        // 建立憑證建立選項，驗證裝置會使用這些選項來生成公開金鑰憑證
        // challenge 是一個隨機的字串，用來防止重送攻擊
        $options = new PublicKeyCredentialCreationOptions(
            rp: $relatedPartyEntity,
            user: $userEntity,
            challenge: Str::random(),
            authenticatorSelection: $authenticatorSelectionCriteria
        );

        // 將 $options 進行序列化，轉換為 JSON 字串
        $options = Serializer::make()->toJson($options);

        // 將序列化後的 $options 儲存在 Flash Session 中，好讓我們在下一個請求中使用
        // 當用戶傳回公開金鑰憑證後，我們需要將 $options 從 Session 取出，用來證明用戶的憑證
        Session::flash('passkey-registration-options', $options);

        // 回傳 JSON 格式的憑證建立選項
        return $options;
    }
}
```

更新 API 路由檔案 `api.php`，加上剛剛新增的控制器。注意這個路由應該只允許用戶在登入的情況下使用，所以需要加上中介層 `middleware('auth:sanctum')` 來驗證請求是否為登入用戶。

```php
<?php

Route::get('/passkeys/register-options', GeneratePasskeyRegisterOptionsController::class)
    ->name('passkeys.register-options')
    ->middleware('auth:sanctum');
```

> Google 說明文件中表示，用戶可以在下列的情況中管理密碼金鑰：
>
> - 用戶登入後，使用者可以在設定頁面管理密碼金鑰
> - 新用戶註冊，使用者可以在註冊時加入密碼金鑰

## 註冊密碼金鑰

接下來的程式碼會包含前端與後端。因為我怕程式碼會過於冗長 🤣，所以我不會放上 Blade 樣板的內容，只會放精簡過後的 JavaScript 程式碼。

假設用戶管理密碼金鑰頁面的設計如下圖：

![Manage passkeys page](https://blobs.docfunc.com/images/2025_04_19_21_56_37_0d6b80c2dd24.png)

如果用戶要註冊新的密碼金鑰，操作流程如下：

1. 先幫密碼金鑰取個名字，然後按下「新增密碼金鑰」的按鈕。
2. 按下按鈕後，前端會從 API 取得憑證建立選項，然後開始請驗證裝置產生憑證。
3. 驗證裝置回傳憑證的資料給前端。
4. 前端將憑證的資料轉成 JSON 字串後，傳送給後端進行證明。
5. 將通過證明的憑證儲存在資料庫中。

按下按鈕後發起註冊流程的 JavaScript 程式碼相當簡單，如下所示：

```javascript
async function registerPasskey() {
    // 檢查瀏覽器是否支援 WebAuthn
    if (!browserSupportsWebAuthn()) {
        throw new Error('你的瀏覽器不支援 WebAuthn');
    }

    // 向 API 取得憑證建立選項
    const response = await fetch('api/passkeys/register-options');
    const optionsJSON = await response.json();

    try {
        // 開始註冊安全金鑰，前端會跳出建立密碼金鑰的 UI
        // 用戶可以在 UI 上選擇要使用的驗證裝置來產生憑證
        const passkey = await startRegistration({
            optionsJSON,
        });
    } catch (e) {
        throw new Error('密碼金鑰註冊失敗');
    }

    // 將憑證的資料轉換為 JSON 字串，然後傳送到後端
    return JSON.stringify(passkey);
}
```

前端需要將驗證裝置產生的憑證資料，傳送到後端進行證明。

```php
<?php

use App\Services\CustomCounterChecker;
use App\Services\Serializer;
use Illuminate\Support\Facades\Session;
use Throwable;
use Webauthn\AuthenticatorAttestationResponse;
use Webauthn\AuthenticatorAttestationResponseValidator;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;
use Webauthn\PublicKeyCredential;
use Webauthn\PublicKeyCredentialCreationOptions;

// ...

public function store(): void
{
    // 驗證用戶傳送過來的資料
    // name 是用戶填寫的金鑰名稱
    // passkey 是憑證資料的 JSON 字串
    $data = $this->validate([
        'name' => ['required', 'string', 'max:255'],
        'passkey' => ['required', 'json'],
    ]);

    // 這裡使用我們剛剛寫的 Serializer 類別
    // 將憑證資料轉換為 PHP 的物件 PublicKeyCredential
    $publicKeyCredential = Serializer::make()
        ->fromJson($data['passkey'], PublicKeyCredential::class);

    if (! $publicKeyCredential->response instanceof AuthenticatorAttestationResponse) {
        // ...

        return;
    }

    // 把剛剛儲存在 Session 裡面的憑證建立選項拿出來
    $options = Session::get('passkey-registration-options');

    if (! $options) {
        // ...

        return;
    }

    // 將憑證建立選項轉換為 PHP 的物件 PublicKeyCredentialCreationOptions
    $publicKeyCredentialCreationOptions = Serializer::make()->fromJson(
        $options,
        PublicKeyCredentialCreationOptions::class,
    );

    $csmFactory = new CeremonyStepManagerFactory;
    // 使用剛剛寫的計數器檢查，來檢查憑證的簽名計數器
    $csmFactory->setCounterChecker(new CustomCounterChecker);

    try {
        // 證明用戶傳送過來的憑證，如果證明失敗就會丟出例外
        $publicKeyCredentialSource = AuthenticatorAttestationResponseValidator::create(
            $csmFactory->requestCeremony()
        )->check(
            authenticatorAttestationResponse: $publicKeyCredential->response,
            publicKeyCredentialCreationOptions: $publicKeyCredentialCreationOptions,
            host: request()->getHost(),
        );
    } catch (Throwable) {
        // ...

        return;
    }

    // 將 $publicKeyCredentialSource 轉換成 PHP 陣列
    $publicKeyCredentialSourceArray = Serializer::make()->toArray(
        $publicKeyCredentialSource
    );

    // 將證明成功的憑證的儲存到資料庫中
    request()->user()->passkeys()->create([
        'name' => $data['name'],
        'credential_id' => $publicKeyCredentialSourceArray['publicKeyCredentialId'],
        'data' => $publicKeyCredentialSourceArray,
    ]);
}
```

後端邏輯完成後，就可以開始註冊密碼金鑰囉！

![Register new passkey](https://blobs.docfunc.com/images/2025_04_19_22_51_40_a81013be098c.gif)

## 提供憑證請求選項的 API

建立一個單一行為控制器 `GeneratePasskeyAuthenticationOptionsController.php`。

```bash
php artisan make:controller Api/GeneratePasskeyAuthenticationOptionsController --invokable
```

類似剛剛回傳憑證建立選項的 API 控制器，這個控制器的目的也很單純，只回傳憑證請求選項。

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Serializer;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Illuminate\Support\Uri;
use Webauthn\Exception\InvalidDataException;
use Webauthn\PublicKeyCredentialRequestOptions;

class GeneratePasskeyAuthenticationOptionsController extends Controller
{
    /**
     * @throws InvalidDataException
     */
    public function __invoke(): string
    {
        // 建立憑證請求選項
        $options = new PublicKeyCredentialRequestOptions(
            challenge: Str::random(),
            rpId: Uri::of(config('app.url'))->host(),
            allowCredentials: [],
        );

        $options = Serializer::make()->toJson($options);

        // 選項一樣要儲存在 Session 中，以便在下一個請求中使用
        Session::flash('passkey-authentication-options', $options);

        return $options;
    }
}
```

在 api.php 中加上憑證請求選項的 API 的路由。

```php
<?php

Route::get('/passkeys/authentication-options', GeneratePasskeyAuthenticationOptionsController::class)
    ->name('passkeys.authentication-options');
```

## 使用密碼金鑰登入

有了密碼金鑰後，接下來就要使用密碼金鑰來進行登入了。

修改登入頁面，多一個「使用密碼金鑰」的按鈕：

![Login page](https://blobs.docfunc.com/images/2025_04_19_22_13_20_6d81bb200b26.png)

使用密碼金鑰登入的流程：

1. 用戶按下「使用密碼金鑰」按鈕。
2. 按下按鈕後，前端會先呼叫 API 取得憑證請求選項，然後開始請驗證裝置進行身分驗證。
3. 驗證裝置回傳憑證的資料給前端。
4. 前端將憑證的資料轉成 JSON 字串後，傳送給後端進行斷言。
5. 斷言成功，將用戶進行登入。

按下「使用密碼金鑰」按鈕後，要執行的 JavaScript 程式碼依舊很精簡。

```javascript
async function loginWithPasskey() {
    if (!browserSupportsWebAuthn()) {
        throw new Error('你的瀏覽器不支援 WebAuthn');
    }

    const response = await fetch('api/passkeys/authentication-options');
    const optionsJSON = await response.json();

    try {
        // 開始身分驗證，前端會跳出 UI
        // 用戶可以在 UI 上選擇要使用的驗證裝置開始身分驗證
        const answer = await startAuthentication({
            optionsJSON,
        });
    } catch (error) {
        throw new Error('密碼金鑰無效');
    }

    // 將憑證的資料轉換為 JSON 字串，然後傳送到後端
    return JSON.stringify(answer);
}
```

後端取得前端傳送過來的憑證資料，開始進行斷言。

```php
<?php

use App\Models\Passkey;
use App\Services\Serializer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Webauthn\AuthenticatorAssertionResponse;
use Webauthn\AuthenticatorAssertionResponseValidator;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;
use Webauthn\PublicKeyCredential;
use Webauthn\PublicKeyCredentialRequestOptions;
use Webauthn\PublicKeyCredentialSource;

// ...

public function loginWithPasskey(): void
{
    // 判斷憑證資料是否為 JSON 格式
    $data = $this->validate(['answer' => ['required', 'json']]);

    // 將憑證資料轉成 PHP 物件 PublicKeyCredential
    $publicKeyCredential = Serializer::make()
        ->fromJson($data['answer'], PublicKeyCredential::class);

    if (! $publicKeyCredential->response instanceof AuthenticatorAssertionResponse) {
        // ...

        return;
    }

    // 取得憑證資料中的 Raw ID
    $rawId = json_decode($data['answer'], true)['rawId'];

    // 使用 Raw ID 從資料庫中尋找相符的憑證
    $passkey = Passkey::firstWhere('credential_id', $rawId);

    if (! $passkey) {
        // ...

        return;
    }

    // 將資料庫中撈出的憑證轉為 PHP 物件 PublicKeyCredentialSource
    $publicKeyCredentialSource = Serializer::make()
        ->fromJson(json_encode($passkey->data), PublicKeyCredentialSource::class);

    // 取出剛剛放在 Session 中的憑證請求選項
    $options = Session::get('passkey-authentication-options');

    if (! $options) {
        // ...

        return;
    }

    // 將選項轉為 PHP 物件 PublicKeyCredentialRequestOptions
    $publicKeyCredentialRequestOptions = Serializer::make()->fromJson(
        $options,
        PublicKeyCredentialRequestOptions::class,
    );

    try {
        // 開始進行斷言，斷言失敗會拋出例外
        AuthenticatorAssertionResponseValidator::create(
            new CeremonyStepManagerFactory()->requestCeremony()
        )->check(
            publicKeyCredentialSource: $publicKeyCredentialSource,
            authenticatorAssertionResponse: $publicKeyCredential->response,
            publicKeyCredentialRequestOptions: $publicKeyCredentialRequestOptions,
            host: request()->getHost(),
            userHandle: null,
        );
    } catch (Throwable) {
        // ...

        return;
    }

    // 斷言成功，更新憑證上次的使用時間
    $passkey->update([
        'last_used_at' => now(),
    ]);

    // 登入用戶
    Auth::loginUsingId(id: $passkey->user_id, remember: true);
    Session::regenerate();
}
```

使用剛剛註冊的密碼金鑰嘗試登入。

![Login with passkey](https://blobs.docfunc.com/images/2025_04_19_22_57_41_8d331687f30f.gif)

## 參考資料

- [WebAuthn Framework](https://webauthn-doc.spomky-labs.com/)
- [SimpeWebAuthn](https://simplewebauthn.dev/)
- [Laracasts：Add Passkeys to a Laravel App](https://laracasts.com/series/add-passkeys-to-a-laravel-app)
- [spatie/laravel-passkeys](https://github.com/spatie/laravel-passkeys)
- [WebAuthn Framework Issue Comment](https://github.com/web-auth/webauthn-framework/issues/685#issuecomment-2629428804)
