# @gubbahrudhay/debounce-lite

A small, lightweight, dependency-free debounce utility with full TypeScript support.

Delays invoking a function until a specified number of milliseconds have elapsed since the last call. Useful for rate-limiting events like search input, window resizing, and scroll handlers.

## Installation

```bash
npm install @gubbahrudhay/debounce-lite
```

## Basic Usage

```ts
import { debounce } from "@gubbahrudhay/debounce-lite";

const search = debounce((query: string) => {
  console.log("Searching:", query);
}, 300);

// Only the last call executes, after 300ms of inactivity
search("c");
search("ca");
search("cat"); // → "Searching: cat" (after 300ms)
```

## API

### `debounce(fn, delay, options?)`

Creates a debounced version of `fn` that delays execution until `delay` milliseconds have passed since the last invocation.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `fn` | `(...args) => unknown` | The function to debounce. |
| `delay` | `number` | Delay in milliseconds (≥ 0). |
| `options` | `DebounceOptions` | Optional configuration object. |

**Returns** a `DebouncedFunction` with `.cancel()`, `.flush()`, and `.pending()` methods.

#### Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `leading` | `boolean` | `false` | Execute on the leading edge instead of the trailing edge. |

---

### `.cancel()`

Cancel any pending invocation. The original function will not execute until the debounced function is called again.

```ts
const save = debounce(() => {
  saveToDatabase();
}, 1000);

save();

// User navigates away — cancel the pending save
save.cancel();
```

### `.flush()`

Immediately execute a pending invocation and cancel the timer. If nothing is pending, this is a no-op.

```ts
const save = debounce((data: string) => {
  saveToDatabase(data);
}, 1000);

save("draft");

// User clicks "Save Now" — flush immediately
save.flush();
```

### `.pending()`

Check whether an invocation is currently waiting to execute.

```ts
const update = debounce(() => {
  refreshUI();
}, 200);

update();
console.log(update.pending()); // true

// After 200ms...
console.log(update.pending()); // false
```

## Leading-Edge Execution

By default, the function fires on the **trailing edge** — after the delay elapses. Set `leading: true` to fire on the **leading edge** instead (immediately on the first call).

```ts
const onClick = debounce(
  () => {
    submitForm();
  },
  500,
  { leading: true }
);

// First click fires immediately
onClick(); // → submitForm() called right away

// Rapid subsequent clicks are ignored until 500ms of quiet
onClick();
onClick();
```

After the delay elapses, any trailing calls that arrived during the delay window will fire. If no new calls arrived, nothing happens on the trailing edge.

## TypeScript

`debounce-lite` ships with built-in TypeScript declarations. The debounced function preserves the parameter types of the original function.

```ts
import { debounce, type DebouncedFunction } from "@gubbahrudhay/debounce-lite";

function greet(name: string, age: number): void {
  console.log(`Hello ${name}, age ${age}`);
}

const debouncedGreet: DebouncedFunction<typeof greet> = debounce(greet, 300);

debouncedGreet("Alice", 30); // ✅ Correct types
debouncedGreet(42);          // ❌ Type error
```

## Compatibility

- **Node.js** ≥ 18
- **Browsers**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Module format**: ESM (`import`/`export`)

The implementation uses only `setTimeout` and `clearTimeout`, which are available in all JavaScript environments.

## Why Use This Package?

- **Zero dependencies** — nothing to audit, nothing to break.
- **Tiny footprint** — the entire implementation is a single small file.
- **Full TypeScript support** — built-in type definitions with parameter inference.
- **Complete API** — `.cancel()`, `.flush()`, and `.pending()` for full control.
- **Leading-edge support** — opt-in immediate execution when you need it.
- **Well-tested** — comprehensive test suite with fake timers.

## How It Works

Debouncing works by wrapping a function in a timer:

1. Each time the debounced function is called, any existing timer is cleared and a new one is set for `delay` milliseconds.
2. If the function is called again before the timer fires, the timer resets.
3. Only when `delay` milliseconds pass without another call does the original function execute — with the arguments from the most recent call.

This effectively collapses many rapid calls into a single execution, using only the last set of arguments.

## License

[MIT](./LICENSE)
