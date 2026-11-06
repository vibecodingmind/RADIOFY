const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET is required");
  process.exit(1);
}

const res = await fetch(`${base}/api/cron/stream-sync`, {
  method: "POST",
  headers: { "x-cron-secret": secret },
});

const body = await res.text();
console.log(res.status, body);
