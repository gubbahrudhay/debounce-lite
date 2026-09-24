import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce } from "../src/index.js";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Basic debounce behavior ──────────────────────────────────────────

  it("should delay execution by the specified amount", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("should only invoke the function once after multiple rapid calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("should reset the timer on each call", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(80);
    expect(fn).not.toHaveBeenCalled();

    debounced(); // reset timer
    vi.advanceTimersByTime(80);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(20);
    expect(fn).toHaveBeenCalledOnce();
  });

  // ── Arguments ────────────────────────────────────────────────────────

  it("should pass the most recent arguments to the callback", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("first");
    debounced("second");
    debounced("third");

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("third");
  });

  it("should handle multiple arguments correctly", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);

    debounced("hello", 42, true);

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith("hello", 42, true);
  });

  // ── `this` context ──────────────────────────────────────────────────

  it("should preserve `this` context", () => {
    const fn = vi.fn(function (this: { name: string }) {
      return this.name;
    });
    const debounced = debounce(fn, 100);

    const obj = { name: "test", search: debounced };
    obj.search();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn.mock.instances[0]).toBe(obj);
  });

  // ── Different delay values ──────────────────────────────────────────

  it("should work with a zero delay", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 0);

    debounced();

    // Even with 0ms delay, setTimeout(fn, 0) defers to next tick
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("should work with a large delay", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 5000);

    debounced();

    vi.advanceTimersByTime(4999);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
  });

  // ── .cancel() ───────────────────────────────────────────────────────

  describe(".cancel()", () => {
    it("should cancel a pending invocation", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced.cancel();

      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();
    });

    it("should be safe to call when nothing is pending", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      // No call to debounced(), cancel should be a no-op
      expect(() => debounced.cancel()).not.toThrow();
    });

    it("should allow new calls after cancellation", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced("first");
      debounced.cancel();

      debounced("second");
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith("second");
    });
  });

  // ── .flush() ────────────────────────────────────────────────────────

  describe(".flush()", () => {
    it("should immediately execute a pending invocation", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 500);

      debounced("immediate");
      debounced.flush();

      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith("immediate");
    });

    it("should clear the timer after flushing", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced.flush();

      vi.advanceTimersByTime(200);
      // Should not fire a second time
      expect(fn).toHaveBeenCalledOnce();
    });

    it("should be a no-op when nothing is pending", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced.flush();
      expect(fn).not.toHaveBeenCalled();
    });

    it("should use the most recent arguments", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced("a");
      debounced("b");
      debounced("c");
      debounced.flush();

      expect(fn).toHaveBeenCalledWith("c");
    });
  });

  // ── .pending() ──────────────────────────────────────────────────────

  describe(".pending()", () => {
    it("should return false when no invocation is pending", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      expect(debounced.pending()).toBe(false);
    });

    it("should return true while an invocation is pending", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(debounced.pending()).toBe(true);
    });

    it("should return false after the invocation fires", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      vi.advanceTimersByTime(100);

      expect(debounced.pending()).toBe(false);
    });

    it("should return false after cancel", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced.cancel();

      expect(debounced.pending()).toBe(false);
    });

    it("should return false after flush", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced.flush();

      expect(debounced.pending()).toBe(false);
    });
  });

  // ── Leading-edge execution ──────────────────────────────────────────

  describe("leading option", () => {
    it("should invoke immediately on the first call", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 200, { leading: true });

      debounced("first");
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith("first");
    });

    it("should not invoke again during the delay period with no new calls", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 200, { leading: true });

      debounced();
      expect(fn).toHaveBeenCalledOnce();

      vi.advanceTimersByTime(200);
      expect(fn).toHaveBeenCalledOnce(); // still just once
    });

    it("should invoke trailing call if new calls come during delay", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 200, { leading: true });

      debounced("first");
      expect(fn).toHaveBeenCalledOnce();

      debounced("second");
      debounced("third");

      vi.advanceTimersByTime(200);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith("third");
    });

    it("should allow a new leading-edge call after the delay elapses", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100, { leading: true });

      debounced("a");
      expect(fn).toHaveBeenCalledOnce();

      vi.advanceTimersByTime(100);

      debounced("b");
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith("b");
    });

    it("should work with cancel in leading mode", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 200, { leading: true });

      debounced("first");
      expect(fn).toHaveBeenCalledOnce();

      debounced("second");
      debounced.cancel();

      vi.advanceTimersByTime(200);
      // The trailing call should have been cancelled
      expect(fn).toHaveBeenCalledOnce();
    });

    it("should work with flush in leading mode", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 200, { leading: true });

      debounced("first"); // leading invocation
      debounced("second"); // queued trailing

      debounced.flush();
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith("second");
    });
  });

  // ── Multiple independent debounced functions ────────────────────────

  describe("multiple independent instances", () => {
    it("should operate independently", () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const debounced1 = debounce(fn1, 100);
      const debounced2 = debounce(fn2, 200);

      debounced1("a");
      debounced2("b");

      vi.advanceTimersByTime(100);
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn2).toHaveBeenCalledOnce();
    });

    it("should not interfere when one is cancelled", () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const debounced1 = debounce(fn1, 100);
      const debounced2 = debounce(fn2, 100);

      debounced1("a");
      debounced2("b");

      debounced1.cancel();

      vi.advanceTimersByTime(100);
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledWith("b");
    });
  });

  // ── Async callback behavior ─────────────────────────────────────────

  describe("async callbacks", () => {
    it("should work with an async function", () => {
      const fn = vi.fn(async (value: string) => {
        return `result: ${value}`;
      });
      const debounced = debounce(fn, 100);

      debounced("test");

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith("test");
    });

    it("should not break if the async callback rejects", () => {
      const fn = vi.fn(async () => {
        throw new Error("failure");
      });
      const debounced = debounce(fn, 100);

      debounced();

      // The debounce mechanism itself should not throw
      expect(() => vi.advanceTimersByTime(100)).not.toThrow();
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("should handle being called with no arguments", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);

      debounced();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledWith();
    });

    it("should allow sequential independent debounce cycles", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      // First cycle
      debounced("first");
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("first");

      // Second cycle
      debounced("second");
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith("second");
    });
  });
});
