# 在 Laravel 中實作密碼金鑰登入

在上一篇文章中，我說明了密碼金鑰的基本概念與原理，這篇文章將會詳細的說明如何在 Laravel 中實作密碼金鑰登入。

密碼金鑰的註冊以及驗證都會

## 安裝後端與前端的依賴函式庫

因為密碼金鑰的實作相當複雜，建議使用別人寫好的函式庫。你可以參考 Awesome WebAuthn 這個 GitHub 專案，上面有列出很多由社群維護的密碼金鑰函式庫。

```bash
# 後端需要的函式庫
compsoer require web-auth/webauthn-lib

# 前端需要的函式庫
npm install @simplewebauthn/browser
```

前端的函式庫在使用前需要先經過 Vite 打包。建立一個檔案 `resources/ts/webauthn.ts`。將需要用到的函式通通放入 window 物件，使其成為全域函式，方便之後在前端頁面上呼叫。

```typescript
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

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

修改 `vite.config.js`，讓 Vite 打包我們剛剛新增的 TypeScript 檔案。

```javascript
export default defineConfig({
  plugins: [
    laravel({
      input: [
        // ...
        // 加上剛剛新增的 TypeScript 檔案
        "resources/ts/webauthn.ts",
      ],
      refresh: true,
    }),
    tailwindcss(),
  ],
});
```

使用 npm 指令執行打包。

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

建立一張資料表來儲存 Passkey 的公鑰憑證。使用 `artisan` 指令來建立模型與 Migration 檔案。

```bash
php artisan make:model Passkey --migration

# INFO Model [app/Models/Passkey.php] created successfully.

# INFO Migration [database/migrations/2025_04_15_220034_create_passkeys_table.php] created successfully.
```

在 Migration 檔案中建立我們需要的資料表欄位。

```php
public function up(): void
{
    Schema::create('passkeys', function (Blueprint $table) {
        $table->id();

        // 建立一個外鍵 user_id，指向 users 資料表的 id 欄位
        $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
        // 用來識別密碼金鑰的名稱，由用戶自行命名
        $table->text('name');
        // 密碼金鑰的憑證 ID。登入時，主要也是比對憑證 ID 是否與前端提供的相符
        $table->text('credential_id');
        // 密碼金鑰的相關資訊
        $table->json('data');

        $table->timestamp('last_used_at')->nullable();
        $table->timestamps();
    });

}
```

使用 artisan 指令建立資料表。

```bash
php artisan migrate
```

修改密碼金鑰模型 `Passkey.php` 的內容，並寫上與用戶模型的關聯。

```php
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

因為註冊與驗證密碼金鑰的過程中，資料需要不停的從 JSON 字串與 PHP 物件中反覆橫跳，也就是進行序列化與反序列化，所以將序列化拉出來單獨寫一個類別。

建立一個檔案 `app/Services/Serializer.php`，並寫入以下的內容。

```php
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
        protected SerializerInterface $serializer,
    ) {}

    // 將傳進來的 PHP 物件轉為 JSON 字串
    public function toJson(mixed $value): string
    {
        return $this->serializer->serialize(
            $value,
            'json',
            [
                // 官方文在建議使用這個選項
                AbstractObjectNormalizer::SKIP_NULL_VALUES => true,
                // 這個選項為選擇性的
                JsonEncode::OPTIONS => JSON_THROW_ON_ERROR,
            ]
        );
    }

    // 將 JSON 字串轉為目標 PHP 實體
    public function fromJson(string $value, string $desiredClass)
    {
        return $this
            ->serializer
            ->deserialize($value, $desiredClass, 'json');
    }
}
```

## 回傳註冊所需資料的 API

建立一個單一行為控制器 `GeneratePasskeyRegisterOptionsController.php`。

```bash
php artisan make:controller Api/GeneratePasskeyRegisterOptionsController --invokable
```

這個控制器只做一件事情，就是回傳註冊金鑰所需要的資料。

```php
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
        // 沒有偏好任何平台，並且要求使用者的金鑰必須支援可探索的憑證
        // 目前可探索的憑證已經是主流，如果這裡沒有強制要求，你的 YubiKey 會無法使用
        $authenticatorSelectionCriteria = AuthenticatorSelectionCriteria::create(
            authenticatorAttachment: AuthenticatorSelectionCriteria::AUTHENTICATOR_ATTACHMENT_NO_PREFERENCE,
            residentKey: AuthenticatorSelectionCriteria::RESIDENT_KEY_REQUIREMENT_REQUIRED,
        );

        // 註冊金鑰的選項，前端會使用這些選項來顯示註冊金鑰的 UI
        // challenge 是一個隨機的字串，用來防止重送攻擊
        $options = new PublicKeyCredentialCreationOptions(
            rp: $relatedPartyEntity,
            user: $userEntity,
            challenge: Str::random(),
            authenticatorSelection: $authenticatorSelectionCriteria
        );

        // 將 $options 物件進行序列化，轉換為 JSON 字串
        $options = Serializer::make()->toJson($options);

        // 將 $options 儲存在 Flash Session 中，好讓我們在下一步驟中使用
        // 當用戶傳回公開金鑰憑證後，我們需要將 $options 從 Session 取出，用來驗證用戶的憑證
        Session::flash('passkey-registration-options', $options);

        return $options;
    }
}
```

更新 API 路由檔案 `api.php` 加上剛剛新增的控制器。注意這個路由應該只允許用戶在登入的情況下才能使用，所以需要加上用來驗證請求是否為登入用戶的中介層 `middleware('auth:sanctum')`。

```php
Route::get('/passkeys/register-options', GeneratePasskeyRegisterOptionsController::class)
    ->name('passkeys.register-options')
    ->middleware('auth:sanctum');
```

> Google 說明文件中表示，用戶可以在以下的情況管理密碼金鑰：
>
> - 用戶登入後，使用者可以在設定頁面中管理密碼金鑰
> - 新用戶註冊，使用者可以在註冊時加入密碼金鑰

## 註冊密碼金鑰

這一段包含前與後端，如果程式碼都寫出來可能太冗長了，所以我只挑重點的片段出來說明，完整的程式碼可以參考 GitHub 上的範例專案。

頁面的設計如下：

<!-- 這裡放上前端頁面圖片 -->

如果用戶需要註冊金鑰，需要先填寫金鑰名稱，然後按下註冊金鑰的按鈕。按下按鈕後，前端會從先從後端取得註冊金鑰的選項，然後開始進行註冊。

下面是一個範例的 JavaScript 程式碼，這段範例程式碼會在用戶按下註冊金鑰的按鈕後執行。

```javascript
async function registerPasskey() {
  // 檢查瀏覽器是否支援 WebAuthn
  if (!browserSupportsWebAuthn()) {
    throw new Error("你的瀏覽器不支援 WebAuthn");
  }

  // 向 API 取得註冊金鑰的選項
  const response = await fetch("api/passkeys/register-options");
  const optionsJSON = await response.json();

  try {
    // 開始註冊金鑰
    const passkey = await startRegistration({
      optionsJSON,
    });
  } catch (e) {
    throw new Error("註冊金鑰失敗");
  }

  // 將註冊金鑰的資訊轉換為 JSON 字串，然後傳送到後端
  return JSON.stringify(passkey);
}
```

如果前端註冊成功，就會取得到一個 JSON 字串，這個字串包含了用戶的金鑰資訊，我們需要將這個字串傳送到後端進行儲存。

```php
public function store(): void
{
    // 驗證用戶傳送過來的資料
    // name 是用戶填寫的金鑰名稱
    // passkey 是用戶註冊金鑰後，前端傳送過來的 JSON 字串
    $data = $this->validate([
        'name' => ['required', 'string', 'max:255'],
        'passkey' => ['required', 'json'],
    ]);

    // 將 passkey 的 JSON 字串轉換為 PHP 的物件 PublicKeyCredential
    // 這裡使用我們剛剛寫的 Serializer 類別
    $publicKeyCredential = Serializer::make()
        ->fromJson($data['passkey'], PublicKeyCredential::class);

    // 驗證用戶傳送過來的資料
    if (! $publicKeyCredential->response instanceof AuthenticatorAttestationResponse) {
        // ...

        return;
    }

    // 剛剛前端在註冊金鑰前，會呼叫 API 取得註冊金鑰的選項
    // API 在執行過程中，會將選項的 JSON 字串儲存在 Session 中
    // 現在要把選項從 Session 拿出來，待會要使用這個選項對 $publicKeyCredential 進行驗證
    $options = Session::get('passkey-registration-options');

    if (! $options) {
        // ...

        return;
    }

    // 將選項的 JSON 字串轉換為 PHP 的物件 PublicKeyCredentialCreationOptions
    $publicKeyCredentialCreationOptions = Serializer::make()->fromJson(
        $options,
        PublicKeyCredentialCreationOptions::class,
    );

    // 這裡使用客製化的 CounterChecker 來檢查密碼金鑰的 Signature Counter
    $csmFactory = new CeremonyStepManagerFactory;
    $csmFactory->setCounterChecker(new CustomCounterChecker);

    try {
        // 驗證用戶傳送過來的金鑰是否有效，如果無效就會丟出例外
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
    $publicKeyCredentialSourceJson = json_decode(
        json: Serializer::make()->toJson($publicKeyCredentialSource),
        associative: true
    );

    // 驗證完成的金鑰的儲存到資料庫中
    request()->user()->passkeys()->create([
        'name' => $data['name'],
        'credential_id' => $publicKeyCredentialSourceJson['publicKeyCredentialId'],
        'data' => $publicKeyCredentialSourceJson,
    ]);
}
```

## 使用密碼金鑰登入

這一段的流程與註冊金鑰的流程類似，前端會先呼叫 API 取得登入金鑰的選項，然後開始進行登入。
登入的過程中，前端會將金鑰的資訊傳送到後端進行驗證，驗證成功後就可以登入了。

首先是按下登入金鑰的按鈕後，前端會呼叫 API 取得登入金鑰的選項，然後開始進行登入。

```javascript
async function loginWithPasskey() {
  if (!browserSupportsWebAuthn()) {
    throw new Error("你的瀏覽器不支援 WebAuthn");
  }

  const response = await fetch("api/passkeys/authentication-options");
  const optionsJSON = await response.json();

  try {
    // 開始密碼金鑰驗證
    // 用戶可以選擇要使用的金鑰開始進行驗證
    const answer = await startAuthentication({
      optionsJSON,
    });
  } catch (error) {
    throw new Error("密碼金鑰無效");
  }

  // 將金鑰的資訊轉換為 JSON 字串，然後傳送到後端
  return JSON.stringify(answer);
}
```

如果前端驗證成功，就會取得到一個 JSON 字串，這個字串包含了用戶的金鑰資訊，我們需要將這個字串傳送到後端進行驗證。

```php
public function loginWithPasskey(): void
{
    $data = $this->validate(['answer' => ['required', 'json']]);

    $publicKeyCredential = Serializer::make()
        ->fromJson($data['answer'], PublicKeyCredential::class);

    if (! $publicKeyCredential->response instanceof AuthenticatorAssertionResponse) {
        // ...

        return;
    }

    $rawId = json_decode($data['answer'], true)['rawId'];

    $passkey = Passkey::firstWhere('credential_id', $rawId);

    if (! $passkey) {
        // ...

        return;
    }

    $publicKeyCredentialSource = Serializer::make()
        ->fromJson(json_encode($passkey->data), PublicKeyCredentialSource::class);

    $options = Session::get('passkey-authentication-options');

    if (! $options) {
        // ...

        return;
    }

    $publicKeyCredentialRequestOptions = Serializer::make()->fromJson(
        $options,
        PublicKeyCredentialRequestOptions::class,
    );

    try {
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

    $passkey->update([
        'last_used_at' => now(),
    ]);

    // 登入用戶
    Auth::loginUsingId(id: $passkey->user_id, remember: true);
    Session::regenerate();
}
```
