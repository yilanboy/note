# 談談 Livewire 4 的 Json Attribute

Livewire v4 在前幾天終於正式發佈啦！這次同樣帶來了翻天覆的的改變 😆，最大的亮點莫過於 **SFC（Single-file Component）** 了。現在你可以將前後端的邏輯都寫在同一個檔案中，讓開發體驗更接近現代化的前端框架。

```blade
<?php

use Livewire\Component;

new class extends Component
{
    // 這裡可以寫後端邏輯
};
?>

<div>
    {{-- 這裡寫前端模板 --}}
</div>
```

> 如果你還是習慣將前後端邏輯分成兩個檔案，Livewire 4 依然支援 MFC（Multi-file Component）的模式。

雖然正式版最近才上線，但我在去年 Livewire 4 還在 Beta 階段時，就已經將自己的部落格升級了，也有協助回報了一些 Bug 🐛。在這次的正式版中，推出了一些 Beta 版本沒有的新功能，其中最讓我眼前一亮的就是新的 `#[Json]` Attribute。

下面是官方文件示範如何使用 `#[Json]` Attribute 實作常見的文章搜尋功能：

```blade
<?php

declare(strict_types=1);

use App\Models\Post;
use Illuminate\Database\Eloquent\Collection;
use Livewire\Attributes\Json;
use Livewire\Component;

new class extends Component
{
    // 將這個方法標註為 json endpoint
    // 你可以在前端使用 $wire.search() 呼叫這個方法，並取得回傳值
    #[Json]
    public function search(string $query): Collection
    {
        // json endpoint 的回傳值會被轉為前端可以直接使用的 json 格式
        return Post::search($query)
            ->take(10)
            ->get();
    }
};
?>

<div x-data="{
    query: '',
    posts: [],
    onInput() {
        // 呼叫後端的 search() 方法取得文章搜尋結果
        $wire.search(query)
            .then(data => posts = data)
    }
}">
    <input
        type="text"
        x-model="query"
        x-on:input.debounce="onInput"
        placeholder="搜尋文章..."
    >

    <ul>
        {{-- 使用迴圈顯示文章搜尋結果 --}}
        <template x-for="post in posts" :key="post.id">
            <li x-text="post.title"></li>
        </template>
    </ul>
</div>
```

`#[Json]` Attribute 可以將 Livewire 組件中的方法變為 **JSON 端點（JSON Endpoint）**。當你在前端使用 JavaScript 調用此方法時，Livewire 會直接回傳 JSON 格式的資料，而且**不會觸發**組件的重新渲染（Re-rendering）流程。

如果你的方法中有使用到 [Validation](https://livewire.laravel.com/docs/4.x/validation) 的話，那麼在 Validation 失敗的時候，Livewire 也會回傳 JSON 格式的錯誤訊息。

```json
{
    status: 422,    // HTTP 狀態碼 (validation 失敗會回傳 422)
    body: null,     // 原始回應的內容 (validation 失敗會回傳 null)
    json: null,     // JSON 格式的回應 (validation 失敗會回傳 null)
    errors: {...}   // Validation 的錯誤訊息
}
```

你可以使用 `catch()` 來處理錯誤訊息。

```javascript
$wire
    .save()
    .then((data) => {
        // 處理成功回應
        console.log(data);
    })
    .catch((e) => {
        if (e.status === 422) {
            // 處理 validation 失敗
            console.log(e.errors);
        }
    });
```

你可能會想，這不就是前端與後端最常見的交互方式嗎？透過 JSON 格式的資料。

## 提升 Livewire 效能的方式，就是不使用 Livewire！？

實際上，隨著 Livewire 的普及，關於它的優缺點與效能優化的討論也越來越多。例如這篇在 Reddit 上[關於 Livewire 優缺點的討論](https://www.reddit.com/r/laravel/comments/1h48jp5/what_are_the_pros_and_cons_of_livewire/)中，有一位開發者的建議獲得了廣泛認同。

他提到，如果你的畫面上有一個區塊需要根據狀態頻繁切換顯示，盡量**不要**這樣寫：

```blade
@if ($isEnabled)
    <div>content here</div>
@endif;
```

因為這會觸發 Livewire 的後端請求與 DOM 更新。他建議使用 Alpine.js 的 `x-show`，效能會好得多：

```blade
<div x-cloak x-show="$wire.isEnabled">
    content here
</div>
```

Laravel 的 Josh Cirre 也有針對這個討論串拍攝影片分享看法。

而在該影片的留言區，Filament 的核心開發者 Alex Six 提到，他們為了提升 Filament 4 的效能花了很多心力，而核心的策略就是：**盡可能的使用 Alpine.js**。

![](https://blobs.docfunc.com/images/2026_01_17_17_49_53_61857890e342.png)

Livewire 的核心開發者 Ryan Chandler，也在去年的 Wire Live 議程中也分享了如何在開發 Livewire App 時充分利用 Alpine.js 的優勢。

這些效能的改善的建議背後都有一個共同點，那就是：

**盡量避免 Livewire 重新渲染。**

原因很簡單，一旦觸發 Livewire 組件的更新，伺服器回應的 Payload 就會包含一大段重新渲染後的 HTML：

```json
{
    "components": [
        {
            "snapshot": "...",
            "effects": {
                "returns": [null],
                // [!code highlight:1]
                "html": "一大片的 HTML ()..."
            }
        }
    ],
    "assets": []
}
```

當互動頻率高或 DOM 結構複雜時，相較於只傳遞單純的 JSON 資料，這種傳遞大量 HTML 的方式顯然會造成較大的效能負擔。

## `#[Json]` 的妙用

當我看到這個新的 `#[Json]` Attribute 時，我腦海中立刻冒出了一極端的想法：

我好像可以完全不觸發 Livewire 的重新渲染，任何需要跟後端取得資料的地方都使用 JSON Endpoint，並使用 Alpine.js 在前端渲染頁面。這樣的使用方式就好像我們熟悉的純 API + 前端框架的模式一般，把效能最大化。

但仔細一想，這樣好像就喪失了 Livewire 的最大魅力，`#[Json]` Attribute 最大的優點，我是它能讓我們能在 Livewire 組件內定義「輕量級的 API 端點」。這意味著：

1. **保留開發體驗**：你依然寫著熟悉的 PHP 方法，直接調用 Eloquent 模型，享受 Laravel 的生態系。
2. **提升前端效能**：當前端需要資料時（例如搜尋建議、動態圖表數據），透過 `#[Json]` 方法獲取純數據，再交由 Alpine.js 進行輕量的 DOM 更新。

這避免了傳統 Livewire「牽一髮動全身」的 HTML 重新渲染，同時也不需要為了這一點點互動特的去寫一支獨立的 API Controller。

總結來說，`#[Json]` 讓 Livewire 組件能更靈活的的在「伺服器端渲染」與「客戶端互動」之間切換，是開發高效能 Livewire 應用不可或缺的新利器。

> 官方文件對於使用 `#[Json]` 的建議如下：
>
> - 實作搜尋建議 (Autocomplete)。
> - 為前端圖表或第三方套件加載動態數據。
> - 任何只需要數據而不需要更新 HTML 結構的互動。

## 參考資料

- [Laravel Livewire - Json Attribute](https://livewire.laravel.com/docs/4.x/attribute-json)
