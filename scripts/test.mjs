import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { mkdirSync, createWriteStream, readdirSync } from "node:fs";
const root = fileURLToPath(new URL("../", import.meta.url));
const stack = "spring";
const dbPort = 55503;
const project = "paytrack";
const dotnet = process.env.DOTNET_CMD || "dotnet";
const mvn = process.platform === "win32" ? "mvnw.cmd" : "./mvnw";
function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32" && /\.(cmd|bat)$/i.test(cmd),
  });
  if (r.status !== 0) throw new Error(cmd + " failed");
}
async function port() {
  const s = createServer();
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  const p = s.address().port;
  await new Promise((r) => s.close(r));
  return p;
}
const database = "test_" + randomUUID().replaceAll("-", "");
if (!/^test_[0-9a-f]{32}$/.test(database))
  throw new Error("Invalid generated test database");
const artifacts = resolve(root, "test-results", database);
let app;
let created = false;
let result = 1;
mkdirSync(resolve(root, "test-results"), { recursive: true });
const log = createWriteStream(resolve(root, "test-results/server.log"));
try {
  run("docker", ["compose", "up", "-d", "--wait"]);
  run("docker", [
    "compose",
    "exec",
    "-T",
    "db",
    "createdb",
    "-U",
    "app",
    database,
  ]);
  created = true;
  if (stack === "spring")
    run(mvn, ["-q", "-DskipTests", "-Dapp.build.dir="+artifacts, "package"], resolve(root, "backend"));
  else run(dotnet, ["build", "backend/App.csproj", "--nologo", "-v", "quiet", "--output", artifacts]);
  const apiPort = await port(),
    receiverPort = await port();
  const env = {
    ...process.env,
    PORT: String(apiPort),
    APP_URLS: "http://127.0.0.1:" + apiPort,
    DB_URL: `jdbc:postgresql://localhost:${dbPort}/${database}`,
    DB_CONNECTION: `Host=localhost;Port=${dbPort};Database=${database};Username=app;Password=local-development-only`,
    WEBHOOK_ALLOWED_ORIGINS: `http://127.0.0.1:${apiPort},http://127.0.0.1:${receiverPort}`,
    TEST_WEBHOOK_ORIGIN: `http://127.0.0.1:${receiverPort}`,
    TEST_API: `http://127.0.0.1:${apiPort}/api`,
  };
  const jar =
    stack === "spring"
      ? readdirSync(artifacts).find((n) =>
          n.endsWith(".jar"),
        )
      : "";
  app = spawn(
    stack === "spring" ? "java" : dotnet,
    stack === "spring"
      ? ["-jar", resolve(artifacts, jar)]
      : [resolve(artifacts, "App.dll")],
    { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] },
  );
  app.stdout.pipe(log);
  app.stderr.pipe(log);
  let ready = false;
  for (let n = 0; n < 120; n++) {
    if (app.exitCode !== null) break;
    try {
      if (
        (
          await fetch(env.TEST_API + "/health", {
            signal: AbortSignal.timeout(1500),
          })
        ).ok
      ) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready)
    throw new Error("API startup failed. See test-results/server.log");
  const test = spawn(process.execPath, ["--test", "tests/api.test.mjs"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  result = await new Promise((r) => test.on("exit", r));
} catch (e) {
  console.error(e);
  result = 1;
} finally {
  if (app && app.exitCode === null) {
    const ended = new Promise((r) => app.once("exit", r));
    app.kill();
    await ended;
  }
  log.end();
  if (created)
    run("docker", [
      "compose",
      "exec",
      "-T",
      "db",
      "dropdb",
      "-U",
      "app",
      database,
    ]);
}
process.exitCode = result || 0;
