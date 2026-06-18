import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const { importAllSources } = await import("../lib/import/all");
  const summary = await importAllSources({ log: console.log, runType: "local", triggeredBy: "local_script" });

  console.log("[import:all] Final summary:");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
