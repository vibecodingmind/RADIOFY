import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PesapalAdapter } from "./pesapal-adapter";

describe("PesapalAdapter.verifyWebhook", () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv, NODE_ENV: "test", PESAPAL_IPN_SECRET: "testsecret" };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("rejects wrong signature", async () => {
    const a = new PesapalAdapter();
    const headers = new Headers({ "pesapal-signature": "bad" });
    const ok = await a.verifyWebhook(headers, '{"foo":1}');
    expect(ok).toBe(false);
  });

  it("accepts valid HMAC", async () => {
    const crypto = await import("crypto");
    const body = '{"status":"COMPLETED"}';
    const sig = crypto.createHmac("sha256", "testsecret").update(body).digest("hex");
    const a = new PesapalAdapter();
    const headers = new Headers({ "pesapal-signature": sig });
    const ok = await a.verifyWebhook(headers, body);
    expect(ok).toBe(true);
  });
});
