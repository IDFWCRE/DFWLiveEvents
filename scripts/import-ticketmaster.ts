import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!key || process.env[key]) continue;
    process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
  }
}

async function main() {
  loadEnvLocal();
  const { importTicketmasterEvents } = await import("../lib/ticketmaster/importer");
  let summary;

  try {
    summary = await importTicketmasterEvents({ log: console.log });
  } catch (error) {
    summary = {
      fetchedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }

  console.log("[ticketmaster] Final summary:");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
