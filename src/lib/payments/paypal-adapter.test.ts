import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PayPalAdapter } from "./paypal-adapter";

describe("PayPalAdapter", () => {
  const origEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...origEnv,
      NODE_ENV: "test",
      PAYPAL_CLIENT_ID: "id",
      PAYPAL_CLIENT_SECRET: "secret",
      PAYPAL_MODE: "sandbox",
    };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("processWebhook activates on BILLING.SUBSCRIPTION.ACTIVATED", async () => {
    const adapter = new PayPalAdapter();
    const orgId = "11111111-1111-1111-1111-111111111111";
    const planId = "22222222-2222-2222-2222-222222222222";
    const res = await adapter.processWebhook({
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: {
        id: "I-SUB-123",
        custom_id: `${orgId}|${planId}|MONTHLY`,
        billing_info: {
          last_payment: {
            amount: { currency_code: "USD", value: "29.00" },
          },
        },
      },
    });
    expect(res.processed).toBe(true);
    expect(res.activate).toEqual({
      orgId,
      planId,
      gatewaySubId: "I-SUB-123",
      amount: 29,
      billingCycle: "MONTHLY",
    });
  });

  it("verifyWebhook calls PayPal verify endpoint", async () => {
    process.env.PAYPAL_WEBHOOK_ID = "WH-1";

    const fetchMock = vi
      .fn()
      // token
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "tok" }),
      })
      // verify
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ verification_status: "SUCCESS" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const adapter = new PayPalAdapter();
    const body = JSON.stringify({ id: "evt-1", event_type: "TEST" });
    const headers = new Headers({
      "paypal-transmission-id": "tid",
      "paypal-transmission-time": "t",
      "paypal-cert-url": "https://example.com/cert",
      "paypal-auth-algo": "SHA256withRSA",
      "paypal-transmission-sig": "sig",
    });

    const ok = await adapter.verifyWebhook(headers, body);
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalled();
  });
});
