/**
 * Options for configuring debounce behavior.
 */
export interface DebounceOptions {
  /**
   * When `true`, the function is invoked on the leading edge of the delay
   * (i.e., immediately on the first call) instead of the trailing edge.
   *
   * Subsequent calls within the delay period are ignored until the delay
   * elapses, after which the next call will fire immediately again.
   *
   * @default false
   */
  leading?: boolean;
}

/**
 * A debounced wrapper around a function, with control methods.
 *
 * @typeParam T - The type of the original function.
 */
export interface DebouncedFunction<T extends (...args: never[]) => unknown> {
  /**
   * Invoke the debounced function. Resets the delay timer on each call.
   * Only the final invocation within the delay window will execute.
   */
  (...args: Parameters<T>): void;

  /**
   * Cancel any pending invocation. The function will not execute
   * until called again.
   */
  cancel(): void;

  /**
   * If an invocation is pending, execute it immediately and cancel
   * the timer. If nothing is pending, this is a no-op.
   */
  flush(): void;

  /**
   * Check whether an invocation is currently pending.
   *
   * @returns `true` if a delayed invocation is waiting to execute.
   */
  pending(): boolean;
}

/**
 * Creates a debounced version of the provided function that delays
 * invoking `fn` until `delay` milliseconds have elapsed since the
 * last time the debounced function was called.
 *
 * @typeParam T - The type of the function to debounce.
 * @param fn - The function to debounce.
 * @param delay - The number of milliseconds to delay. Must be >= 0.
 * @param options - Optional configuration.
 * @returns A new debounced function with `.cancel()`, `.flush()`, and `.pending()` methods.
 *
 * @example
 * ```ts
 * import { debounce } from "debounce-lite";
 *
 * const search = debounce((query: string) => {
 *   console.log("Searching:", query);
 * }, 300);
 *
 * search("c");
 * search("ca");
 * search("cat"); // Only this call executes, after 300ms
 * ```
 */
export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delay: number,
  options: DebounceOptions = {},
): DebouncedFunction<T> {
  const { leading = false } = options;

  let timerId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;

  /**
   * Execute the stored function call and reset state.
   */
  function invoke(): void {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;

    if (args !== null) {
      fn.apply(thisArg, args);
    }
  }

  /**
   * The debounced wrapper function.
   */
  function debounced(this: unknown, ...args: Parameters<T>): void {
    lastArgs = args;
    lastThis = this;

    if (leading && timerId === null) {
      // Leading edge: invoke immediately on the first call in a new cycle
      invoke();
    }

    // Clear any existing timer and start a fresh delay
    if (timerId !== null) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      timerId = null;

      // On trailing edge: invoke if there are pending args
      // (for leading mode, lastArgs will be null if no new calls came in)
      if (!leading && lastArgs !== null) {
        invoke();
      } else if (leading && lastArgs !== null) {
        // Leading mode with subsequent calls: execute the latest trailing call
        invoke();
      }
    }, delay);
  }

  /**
   * Cancel any pending invocation.
   */
  debounced.cancel = function cancel(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  /**
   * Immediately execute a pending invocation, if any.
   */
  debounced.flush = function flush(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
      invoke();
    }
  };

  /**
   * Check whether an invocation is currently pending.
   */
  debounced.pending = function pending(): boolean {
    return timerId !== null;
  };

  return debounced as DebouncedFunction<T>;
}
