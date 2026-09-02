# 使用 Livewire 時應該注意的幾個問題

本篇文章會介紹幾個我使用 laravel livewire 時曾不小心犯的幾個錯誤。

## Single-Level Root Element

這是我當初使用 livewire 時，因為沒仔細看文件所犯的基本錯誤，livewire 的元件 (component) 一定要是 single-level root element，也就是只能有一個根元素。

```html
<!-- livewire-component.blade.php -->

<div>
    <!-- 只能有一個根元素 -->
</div>
```

錯誤的元件範例。

```html
<!-- livewire-wrong-component.blade.php -->

<div>
    <!-- 我是第一個根元素 -->
</div>

<div>
    <!-- 我是第二個根元素 -->
</div>
```

## 使用迴圈時，應該加上 Key 來追蹤元素的變化

Laravel livewire 有一個 DOM (Document Object Model) diffing/patching 系統，該系統會偵測元素的變化，並對元素進行新增、修改或移除。

但在某些狀況下，livewire 會無法追蹤元素的變化，例如在元件中使用迴圈。

```html
<ul>
    @foreach ($items as $item)
    <li>{{ $item }}</li>
    @endforeach
</ul>
```

雖然上方可以正常顯示，但如果 `$items` 有更新的話，`livewire` 會無法正確更新列表的狀態，而解決方法就是幫元素加上 `wire:key` 屬性，幫助 `livewire` 去追蹤元素的變化。

```html
<ul>
    @foreach ($items as $item)
    <li wire:key="item-{{ $item->id }}">{{ $item }}</li>
    @endforeach
</ul>
```

注意 key 必須使用唯一值，因此建議加上前綴 (prefix)，避免使用 `$loop->index` 這種可能會重複的值。

如果迴圈中包的是另外一個 livewire component，key 的用法如下。

```html
<ul>
    @foreach ($items as $item)
        @livewire('view-item', ['item' => $item], key('item-'.$item->id))

        <!-- key() using Laravel 7's tag syntax -->
        <livewire:view-item :item="$item" :wire:key="'item-'.$item->id">
    @endforeach
</ul>
```

Vue 的 `v-for` 也會要求使用 key 來追蹤元素的變化，詳細可以參考下面這篇文章了解 key 的用途。

[How & Why to use the \`:key\` attribute in VueJS v-for loops](https://codelistic.com/how-and-why-to-use-the-key-attribute-in-vuejs-v-for-loops)

## 在更新父元件時，讓子元件的內容也一起更新

如剛剛提到的，我們會在迴圈中使用 `前綴 + id` 當作 key，來幫助 livewire 追蹤元素的變化，並對元素進行新增或是刪除。

假設資料的數量不變，但內部的內容有改變的話，livewire 是無法從 `前綴 + id` 的 key 值追蹤到這個元素的更新 (因為數量沒有變化)。

### 簡單舉個留言板的例子

假設我們有一個顯示所有留言的 `comment-list` 元件，與顯示單一留言的 `comment-item` 元件。

`comment-list` 元件會從資料庫中讀取所有留言，並將留言內容傳入 `comment-item` 元件。

### 資料表

我們有一個資料表 `comments`，其結構與內容如下。

| id  | body      | created_at          | updated_at          |
| --- | --------- | ------------------- | ------------------- |
| 1   | comment 1 | 2023-01-23 14:04:25 | 2023-01-23 14:04:25 |
| 2   | comment 2 | 2023-01-23 14:04:25 | 2023-01-23 14:04:25 |
| 3   | comment 3 | 2023-01-23 14:04:25 | 2023-01-23 14:04:25 |
| 4   | comment 4 | 2023-01-23 14:04:25 | 2023-01-23 14:04:25 |

### Comment List 元件

`comment-list` 元件的後端程式碼。

```php
<?php

// CommentList.php

namespace App\Http\Livewire;

use App\Models\Comment;
use Livewire\Component;

class CommentList extends Component
{
    // 設定一個 event listener
    // 這個 event listener 可以用來重整 comment-list 元件
    protected $listeners = ['refreshCommentList' => '$refresh'];

    public function render()
    {
        return view('livewire.comment-list', ['comments' => Comment::all()]);
    }
}
```

`comment-list` 元件的前端程式碼。

```html
<!-- comment-list.blade.php -->

<div class="space-y-6 w-1/2">
    @foreach ($comments as $comment)
    <livewire:comment-item
        :comment-id="$comment->id"
        :body="$comment->body"
        :created-at="$comment->created_at->format('Y 年 m 月 d 日')"
        :wire:key="'comment-'.$comment->id"
    />
    @endforeach
</div>
```

### Comment Item 元件

`comment-item` 元件的後端程式碼。

需要注意的是，**屬性不能夠使用** `$id` **命名**，因為該屬性名稱已被 livewire 所使用。

```php
<?php

// CommentItem.php

namespace App\Http\Livewire;

use Livewire\Component;

class CommentItem extends Component
{
    // 注意屬性不能使用 $id，因此這裡我們囉嗦一點，使用 $commentId
    public int $commentId;

    public string $body;

    public string $createAt;

    public function render()
    {
        return view('livewire.comment-item');
    }
}
```

`comment-item` 的前端程式碼。

```html
<!-- comment-item.blade.php -->

<div class="ml-5">
    <div class="flex items-center justify-between border border-blue-400 p-5">
        <div>{{ $body }}</div>

        <div>{{ $createAt }}</div>

        <!-- 點擊這個按鈕可以觸發 CommentList.php 中的 refreshCommentGroup 事件 -->
        <button
            wire:click="$emit('refreshCommentList')"
            class="text-white bg-blue-500 hover:bg-blue-600 rounded-lg py-2 px-4"
        >
            重新整理
        </button>
    </div>
</div>
```

> 可以上述的程式碼得知，`comment-list` 是 `comment-item` 的父元件。

我們測試一下，假設我們在 `comments` 資料表新增一筆資料，然後按下 `comment-item.blade.php` 中的重新整理按鈕 (不是重新整理頁面喔)。

可以發現畫面上多了剛剛在資料表中新增的留言。

> Livewire 是透過 XHR 請求取得新的資料，並根據資料的內容更新畫面上的 DOM，所以不用重新整理頁面，也能夠更新畫面上的資料。

接下來我們不新增資料，而是只修改某一筆資料的 `body` 內容看看，然後按下重新整理按鈕。

你會發現...資料沒有任何變化。

因為 livewire 是從 key 值去判斷畫面如何更新，因為我們沒有新增資料，所以 id 數量不變，這會讓 livewire 以為資料沒變化，因此不會有任何動作。

如果想要在 `body` 被修改後觸發畫面更新，我們需要把 `body` 也加入 `:wire:key` 中，讓 `livewire` 知道 `body` 有被修改。

```html
<!-- comment-list.blade.php -->

<div class="space-y-6 w-1/2">
    @foreach ($comments as $comment)
    <livewire:comment-item
        :body="$comment->body"
        :created-at="$comment->created_at->format('Y 年 m 月 d 日')"
        :wire:key="'comment-'.$comment->id.'-'.$comment->body"
    />
    @endforeach
</div>
```

在資料表中更動 `body` 資料後，再次按下 `comment` 中的重新整理按鈕，就會發現資料可以正常更新了。

根據這個思維，其實你可以在 `:wire:key` 設定一個每一次重新整理都會更動的值，這樣就能確保每次父元件更新資料時，子元件也會一起更新，例如 `now()->toString()`。

```html
<!-- comment-list.blade.php -->

<div class="space-y-6 w-1/2">
    @foreach ($comments as $comment)
    <livewire:comment-item
        :body="$comment->body"
        :created-at="$comment->created_at->format('Y 年 m 月 d 日')"
        :wire:key="now()->toString()"
    />
    @endforeach
</div>
```

> 雖然這也是個方法，但實際應該還是依照情況去設定 key 的值。

## 屬性設定 Model 可能會產生的問題

Livewire 的屬性 (property) 類型是有限制的。

- 與 javascript 相容的格式，例如 `string`、`int`、`array` 與 `boolean`。
- 部分 PHP 類型，例如 `Stringable`, `Collection`, `DateTime`, `Model`, `EloquentCollection`。

雖然 `Model` 也可以當作 livewire 的屬性，但有幾點需要注意，第一個是資安問題，livewire 文件中已經明確提到不要將敏感資料儲存在屬性中，因為這些屬性的資料會存放在前端，因此屬性使用 `Model` ，等於是將 `Model` 的資料存在前端，有可能一不小心就洩漏敏感資料 (例如 User Model 的 email 資料)。

這部分的疑慮可以參考下方這篇文章。

[Advanced Livewire: A better way of working with models](https://forum.archte.ch/livewire/t/advanced-livewire-a-better-way-of-working-with-models)

除了上述原因，還有另外一個我個人不太推薦在屬性上使用 `Model` 的原因。

## 奇怪的 404 問題

我們為剛剛的留言加上一個修改留言的功能，新增一個 `edit-comment` 元件。

### Edit Comment 元件

`edit-comment` 元件的後端程式碼。

```php
<?php

// EditComment.php

namespace App\Http\Livewire;

use App\Models\Comment;
use Livewire\Component;

class EditComment extends Component
{
    // 在屬性上使用 Comment Model
    public Comment $comment;

    // 新留言的內容
    public string $body = '';

    protected $listeners = ['setEditComment'];

    // 先透過 comment id 取得 comment 的完整資料，並更新 body 的資料
    public function setEditComment(Comment $comment)
    {
        $this->comment = $comment->id;
        $this->body = $this->comment->body;
    }

    public function update(): void
    {
        // 更新留言
        $this->comment->update(['body' => $this->body]);
    }

    public function render()
    {
        return view('livewire.edit-comment');
    }
}
```

`edit-comment` 元件的前端程式碼。

```html
<!-- edit-comment.blade.php -->

<div>
    <form wire:submit.prevent="update">
        <label for="body"></label>

        <!-- 與後端的屬性 body 資料綁定在一起 -->
        <textarea
            wire:model="body"
            id="body"
            placeholder="寫下你的新留言"
        ></textarea>

        <button type="submit">更新</button>
    </form>
</div>
```

然後在剛剛的 `comment-list` 前端程式碼上面，加上 `edit-comment` 的元件。

```html
<!-- comment-list.blade.php -->

<div class="space-y-6 w-1/2">
    @foreach ($comments as $comment)
    <livewire:comment-item
        :body="$comment->body"
        :created-at="$comment->created_at->format('Y 年 m 月 d 日')"
        :wire:key="'comment-'.$comment->id.'-'.$comment->body"
    />
    @endforeach

    <!-- 將 edit-comment 加在這裡 -->
    <livewire:edit-comment />
</div>
```

接下來，我們先幫 `comment-item` 元件加上一個刪除留言的功能。

```php
<?php

// CommentItem.php

namespace App\Http\Livewire;

use App\Models\Comment;
use Livewire\Component;

class CommentItem extends Component
{
    public int $commentId

    public string $body;

    public string $createAt;

    // 加上一個刪除留言的功能
    public function destroy(Comment $comment)
    {
        $comment->delete();

        // 刪除後重新整理留言列表
        $this->emitUp('refreshCommentList');
    }

    public function render()
    {
        return view('livewire.comment-item');
    }
}
```

然後在 `comment-item` 前端程式碼加上刪除與修改的按鈕。

```html
<!-- comment-item.blade.php -->

<div class="ml-5">
    <div class="flex items-center justify-between border border-blue-400 p-5">
        <div>{{ $body }}</div>

        <div>{{ $createAt }}</div>

        <button
            wire:click="$emit('refreshCommentList')"
            class="text-white bg-blue-500 hover:bg-blue-600 rounded-lg py-2 px-4"
        >
            重新整理
        </button>

        <!-- 點擊這個按鈕可以觸發 EditComment.php 中的 setEditComment 事件 -->
        <button
            wire:click="$emit('setEditComment', {{ $commentId }})"
            class="text-white bg-blue-500 hover:bg-blue-600 rounded-lg py-2 px-4"
        >
            修改
        </button>

        <button
            wire:click="destroy({{ $commentId }})"
            class="text-white bg-blue-500 hover:bg-blue-600 rounded-lg py-2 px-4"
        >
            刪除
        </button>
    </div>
</div>
```

一切準備就緒之後，接下來請按照下方步驟依序執行，讓我們嘗試觸發一個奇怪的問題：

1. 我們先按畫面上第一個留言的修改按鈕
2. 此時 `edit-comment.blade.php` 的內容就會更新，`<textarea>` 會出現第一個留言內容的資料，這時先不要做任何動作
3. 我們按下第一個留言的刪除按鈕，將第一個留言從資料庫中刪除，並重新整理留言列表
4. 接下來按下第二個留言的修改按鈕

你可能會預期 edit-comment 前端程式碼的 `<textarea>` 會更新上第二個留言的內容，但你的畫面應該出現了...

一個彈跳視窗顯示 404 且資料找不到的錯誤。

關於這個問題，我很推薦拜讀下面這篇由 livewire 作者所寫的文章，文章中詳細的說明了 livewire 的執行方式。

[Livewire isn't actually "live"](https://calebporzio.com/livewire-isnt-actually-live)

當你按下第一個留言的修改按鈕時，`edit-comment` 元件的 $`comment` 屬性會被載入第一個留言的資料，**並且將這個狀態儲存在前端中**。

接下來我們故意將第一個留言從資料庫中刪除。

隨後我們按下第二個留言的修改按鈕，一般來說，我們預期 livewire 會幫我們載入第二個留言的資料，但在這之前，**livewire 會先從前端發出的 XHR 請求中取得剛剛的狀態**，根據狀態的內容，livewire 會先幫我們載入第一個留言的資料。

但我們先前已經刪除了第一個留言，因此 livewire 在無法取得正確的資料後，就會出現錯誤。

要修正這個問題，我們可以避免在屬性上使用 `Model`，而是在呼叫方法後再執行一次查詢取得留言的資料。

```php
<?php

// EditComment.php

namespace App\Http\Livewire;

use App\Models\Comment;
use Livewire\Component;

class EditComment extends Component
{
    // 新留言的內容
    public string $body = '';

    protected $listeners = ['setEditComment'];

    // 先透過 comment id 取得 comment 的完整資料，並更新 body 的資料
    public function setEditComment(Comment $comment)
    {
        $this->body = $comment->body;
    }

    public function update(Comemnt $comment): void
    {
        // 更新留言
        $comment->update(['body' => $this->body]);
    }

    public function render()
    {
        return view('livewire.edit-comment');
    }
}
```

> 這個問題曾在 GitHub Issue 上被討論過。
>
> [404 Not Found Modal after delete · Issue #2135 · livewire/livewire (github.com)](https://github.com/livewire/livewire/issues/2135)

## 編輯器失蹤事件

這個問題之前有專門寫一篇文章討論過。

[在 Livewire 中使用 CKEditor 所遇到的各種問題](https://docfunc.com/posts/80)

基本上由 JavaScript 產生的 DOM 在 livewire 重新整理元件後都會消失，我們可以使用 `wire:ignore` 來解決這個問題，詳細的原由可以參考上面的文章。

## 參考資料

- [How & Why to use the \`:key\` attribute in VueJS v-for loops](https://codelistic.com/how-and-why-to-use-the-key-attribute-in-vuejs-v-for-loops)
- [Advanced Livewire: A better way of working with models](https://forum.archte.ch/livewire/t/advanced-livewire-a-better-way-of-working-with-models)
- [livewire nesting component only works once](https://github.com/livewire/livewire/discussions/1895)
- [[教學] CSR 和 SSR 的差別是什麼? CSR 和 SSR 的超詳細比較!](https://shubo.io/rendering-patterns/)
- [Livewire - Security](https://laravel-livewire.com/docs/2.x/security)
- [Livewire isn’t actually “live”](https://calebporzio.com/livewire-isnt-actually-live)
