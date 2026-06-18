import { NextResponse } from "next/server";
import { isCronOrAdminAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { importAllSources } from "@/lib/import/all";

export async function GET(request: Request) {
  if (!isCronOrAdminAuthorized(request)) {
    return unauthorizedJson();
  }

  const summary = await importAllSources({ runType: "cron", triggeredBy: "vercel_cron" });
  const status = summary.errors.length ? "partial_success" : "success";

  return NextResponse.json({ status, ...summary });
}
