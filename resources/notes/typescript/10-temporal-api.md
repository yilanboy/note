# Temporal API 使用方式

`Temporal` 是 JavaScript 全新的日期時間處理 API（TC39 Stage 3 提案），目標是取代長年被詬病的 `Date` 物件。

`Date` 物件的痛點：

- **可變 (mutable)**：任何函式拿到 `Date` 物件都可能偷偷修改它，容易產生難以追蹤的 Bug。
- **月份從 0 開始**：`new Date(2026, 0, 1)` 才是 1 月，非常反直覺。
- **沒有時區概念**：只能表示「本地時間」或「UTC」，處理跨時區行事曆等需求很痛苦。
- **字串解析不穩定**：`new Date("2026-01-01")` 在不同瀏覽器/環境下解析結果可能不同。

`Temporal` 針對這些問題重新設計，所有物件皆為**不可變 (immutable)**，且依用途拆分成多種型別。

> 截至目前，`Temporal` 尚未在所有主流瀏覽器與 Node.js 正式版中原生支援，開發時需要使用 polyfill：
>
> ```bash
> npm install @js-temporal/polyfill
> ```
>
> ```typescript
> import { Temporal } from '@js-temporal/polyfill';
> ```

## 常用型別總覽

| 型別                     | 用途                                        |
| ------------------------ | ------------------------------------------- |
| `Temporal.PlainDate`     | 只有日期，沒有時間與時區（例如生日）        |
| `Temporal.PlainTime`     | 只有時間，沒有日期與時區（例如營業時間）    |
| `Temporal.PlainDateTime` | 日期 + 時間，沒有時區                       |
| `Temporal.ZonedDateTime` | 日期 + 時間 + 時區，最接近 `Date` 但更嚴謹  |
| `Temporal.Instant`       | 時間軸上的一個絕對時間點（等同 UTC 時間戳） |
| `Temporal.Duration`      | 一段時間長度（例如 3 天 2 小時）            |
| `Temporal.Now`           | 取得「現在」的各種型別                      |

## 取得目前時間

```typescript
// 目前的時區日期時間
const now = Temporal.Now.zonedDateTimeISO();
console.log(now.toString()); // 2026-07-23T14:30:00+08:00[Asia/Taipei]

// 只取得日期
const today = Temporal.Now.plainDateISO();
console.log(today.toString()); // 2026-07-23

// 取得絕對時間點（等同 Date.now()）
const instant = Temporal.Now.instant();
console.log(instant.epochMilliseconds);
```

## PlainDate：只處理日期

```typescript
const date = Temporal.PlainDate.from({ year: 2026, month: 7, day: 23 });

console.log(date.year); // 2026
console.log(date.month); // 7（月份從 1 開始，不是 0！）
console.log(date.dayOfWeek); // 4（星期四，週一為 1）

// 不可變，加減運算會回傳新的物件
const nextWeek = date.add({ days: 7 });
console.log(nextWeek.toString()); // 2026-07-30

// 字串直接解析
const parsed = Temporal.PlainDate.from('2026-01-01');
```

## PlainDateTime 與 ZonedDateTime

`PlainDateTime` 沒有時區，適合用於「這個時間點在任何時區看起來都一樣」的場景（例如系統排程設定）；若需要精確描述「某個時區的某個時刻」，要用 `ZonedDateTime`。

```typescript
const dt = Temporal.PlainDateTime.from('2026-07-23T09:00:00');

// 加上時區才會變成 ZonedDateTime
const zoned = dt.toZonedDateTime('Asia/Taipei');
console.log(zoned.toString()); // 2026-07-23T09:00:00+08:00[Asia/Taipei]

// 轉換到另一個時區，絕對時間點不變，只是顯示的時間不同
const inTokyo = zoned.withTimeZone('Asia/Tokyo');
console.log(inTokyo.toString()); // 2026-07-23T10:00:00+09:00[Asia/Tokyo]
```

## Duration：時間長度的運算

```typescript
const duration = Temporal.Duration.from({ hours: 2, minutes: 30 });

const start = Temporal.PlainTime.from('09:00:00');
const end = start.add(duration);
console.log(end.toString()); // 11:30:00

// 計算兩個日期之間的差距
const a = Temporal.PlainDate.from('2026-01-01');
const b = Temporal.PlainDate.from('2026-07-23');
const diff = a.until(b, { largestUnit: 'month' });
console.log(diff.toString()); // P6M22D（6 個月 22 天）
```

## 比較日期時間

`Temporal` 物件本身不能直接用 `<`、`>` 比較（因為底層不是 primitive），要用靜態的 `compare` 方法或實例的 `equals`：

```typescript
const d1 = Temporal.PlainDate.from('2026-01-01');
const d2 = Temporal.PlainDate.from('2026-07-23');

Temporal.PlainDate.compare(d1, d2); // -1（d1 早於 d2）
d1.equals(d2); // false

// 排序
const dates = [d2, d1].sort(Temporal.PlainDate.compare);
```

## 格式化輸出

`Temporal` 物件同樣支援 `Intl.DateTimeFormat`，可以直接沿用既有的本地化格式化邏輯：

```typescript
const zoned = Temporal.Now.zonedDateTimeISO('Asia/Taipei');

const formatter = new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'long',
    timeStyle: 'short',
});

console.log(formatter.format(zoned)); // 2026年7月23日 下午2:30
```

## 與 Date 互轉

在 polyfill 尚未完全取代 `Date` 的過渡期，常常需要跟既有的 `Date` 物件互相轉換：

```typescript
// Date -> Temporal.Instant -> ZonedDateTime
const legacyDate = new Date();
const instant = Temporal.Instant.fromEpochMilliseconds(legacyDate.getTime());
const zoned = instant.toZonedDateTimeISO('Asia/Taipei');

// Temporal -> Date
const backToDate = new Date(zoned.epochMilliseconds);
```

## 參考資料

- [Temporal 官方文件](https://tc39.es/proposal-temporal/docs/)
- [MDN - Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)
- [@js-temporal/polyfill](https://www.npmjs.com/package/@js-temporal/polyfill)
