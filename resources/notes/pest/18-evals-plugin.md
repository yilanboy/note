# Pest 5: Evals Plugin

Pest 的 "Evals" Plugin 是一個專為測試與大型語言模型（LLM）互動的軟體而設計的工具。與傳統測試檢查「精確相等」不同，"evals" 用於衡量 AI 輸出的「品質」。

## 用途

當你的應用程式有使用 LLM（例如 OpenAI、Anthropic）來生成內容、回答問題或執行任務時，你需要一種方法來評估這些 AI 生成結果的好壞。Evals Plugin 就是為此而生。

它讓你可以在測試中結合傳統的確定性檢查（如 `toContain`）和由 AI 驅動的「評分器」（Scorers），這些評分器可以根據相關性、安全性等品質對輸出進行評分。

## 原理

Evals 測試預設情況下會被跳過，以保持主要測試套件的快速和確定性。要運行它們，你必須使用 `--evals` 旗標，這會觸發對 LLM 的真實 API 呼叫。

當使用 AI 驅動的評分器時，Evals Plugin 會在背後呼叫一個「裁判」模型（judge model）和一個「嵌入」模型（embedding model）來對你的 AI 應用程式的輸出進行評分。例如，`toBeRelevant()` 會讓裁判模型判斷回應與提示是否相關。

## 使用方法

### 安裝

1.  **安裝 Evals Plugin:**
    ```bash
    composer require pestphp/pest-plugin-evals --dev
    ```

2.  **安裝 AI 評分驅動:**
    為了使用 AI 評分器，你需要安裝驅動程式。預設情況下，它與 Laravel AI 整合。
    ```bash
    composer require laravel/ai --dev
    ```
    同時，你需要將 `OPENAI_API_KEY` 加入到你的 `.env` 檔案中。

### 撰寫 Eval 測試

Evals 測試的寫法與其他 Pest 測試非常相似。你將一個代理類別或閉包傳遞給 `expect()`，提供一個提示，然後對回應進行斷言。

```php
use App\Agents\CapitalCityAgent;

it('能正確回答首都問題', function (): void {
    expect(CapitalCityAgent::class)
        ->prompt('法國的首都是哪裡？')
        ->toContain('巴黎'); // 確定性檢查
});
```

### 運行 Evals

```bash
# 運行所有 Evals 測試
./vendor/bin/pest --evals

# 顯示 AI 評分器的詳細評分過程和理由
./vendor/bin/pest --evals -v
```

## 主要功能

### 確定性斷言 (Deterministic Expectations)

這些檢查直接檢視 LLM 的輸出，無需額外的 AI 呼叫。
- `->toContain('substring')`
- `->toMatch('/regex/')`
- `->toBe('exact value')`
- `->toBeJson()`

### AI 驅動的評分器 (AI-Powered Scorers)

這些評分器需要一個裁判模型，並將 AI 的輸出評為 0.0 到 1.0 之間的分數。
- `->toBeRelevant()`: 斷言回應與提示相關。
- `->toBeSafe()`: 檢查回應是否包含有害內容。
- `->toBeCorrect(expected: '東京')`: 斷言回應在事實上與參考答案一致。
- `->toBeSimilar('柏林')`: 使用嵌入來斷言回應在語意上與預期答案相似。
- `->toSatisfy('回應應該是熱情友好的...')`: 最靈活的評分器，使用 LLM 裁判來檢查回應是否滿足自然語言描述。

### 工具和代理斷言 (Tool & Agent Assertions)

- `->toHaveToolCalls([...])`: 斷言代理呼叫了特定的工具並帶有預期的參數。
- `->toFollowTrajectory([...])`: 斷言代理按特定順序呼叫了一系列工具。

### 取樣 (Sampling)

為了確保一致性，你可以使用 `repeat()` 多次運行同一個提示，後續的斷言將會檢查所有生成的回應樣本。
```php
expect(CapitalCityAgent::class)
    ->prompt('澳大利亞的首都是哪裡？')
    ->repeat(3) // 重複 3 次
    ->toMatch('/Canberra/i');
```

## 客製化

你可以透過在 `tests/Pest.php` 中設定自定義的 `JudgeDriver` 和 `EmbeddingsDriver` 來使用不同的 LLM 供應商（如 Anthropic）或自託管的模型，甚至是在本地測試中使用固定的確定性結果。
