import { describe, it, expect } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("allows requests under limit", () => {
    expect(rateLimit("a", 3, 60_000)).toEqual({ ok: true });
    expect(rateLimit("a", 3, 60_000)).toEqual({ ok: true });
    expect(rateLimit("a", 3, 60_000)).toEqual({ ok: true });
  });

  it("blocks when limit exceeded", () => {
    const r = rateLimit("b", 1, 60_000);
    expect(r.ok).toBe(true);
    const r2 = rateLimit("b", 1, 60_000);
    expect(r2.ok).toBe(false);
    expect(r2.retryAfterSec).toBeDefined();
  });
});
