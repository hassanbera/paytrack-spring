import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { createServer } from "node:http";
const base = process.env.TEST_API;
if (!base)
  throw new Error(
    "TEST_API must point to a disposable test API/database; see README.",
  );
async function request(method, path, body, status = 200) {
  const r = await fetch(base + "/" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const j = await r.json();
  assert.equal(r.status, status, JSON.stringify(j));
  return j.data;
}
const get = (p) => request("GET", p);
const post = (p, b, status) => request("POST", p, b, status);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
test("database health", async () =>
  assert.equal((await get("health")).status, "ok"));
test("unknown ID is rejected", async () => {
  const r = await fetch(base + "/plans/" + randomUUID());
  assert.ok([404, 405].includes(r.status));
});
test("integer cents, month-end schedule, partial payment and idempotency", async () => {
  const p = await post("plans", {
    title: "API test",
    clientName: "Test Client",
    clientEmail: "client@example.com",
    totalCents: 10001,
    count: 3,
    firstDueDate: "2027-01-31",
  });
  let d = await get("plans/" + p.id);
  assert.deepEqual(
    d.installments.map((x) => x.installment.amountCents),
    [3334, 3334, 3333],
  );
  assert.deepEqual(
    d.installments.map((x) => x.installment.dueDate),
    ["2027-01-31", "2027-02-28", "2027-03-31"],
  );
  const id = d.installments[0].installment.id;
  const body = {
    amountCents: 1000,
    note: "Partial",
    idempotencyKey: randomUUID(),
  };
  const [a, b] = await Promise.all([
    post("installments/" + id + "/payments", body),
    post("installments/" + id + "/payments", body),
  ]);
  assert.equal(a.id, b.id);
  d = await get("plans/" + p.id);
  assert.equal(d.installments[0].installment.paidCents, 1000);
  assert.equal(d.installments[0].payments.length, 1);
  await post(
    "installments/" + id + "/payments",
    { ...body, amountCents: 999 },
    409,
  );
  const responses = await Promise.all(
    [1, 2].map(() =>
      fetch(base + "/installments/" + id + "/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: 2000,
          note: "Race",
          idempotencyKey: randomUUID(),
        }),
      }),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  d = await get("plans/" + p.id);
  assert.equal(d.installments[0].installment.paidCents, 3000);
  await post(
    "plans",
    {
      title: "Bad",
      clientName: "T",
      totalCents: 1,
      count: 2,
      firstDueDate: "2027-01-01",
    },
    400,
  );
  await post(
    "plans",
    {
      title: "Bad",
      clientName: "T",
      clientEmail: "invalid",
      totalCents: 100,
      count: 1,
      firstDueDate: "2027-01-01",
    },
    400,
  );
});
