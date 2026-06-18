import { NextResponse } from "next/server";
import { currentUserIsAdmin } from "@/lib/auth/profiles";

export function isAdminImportTokenAuthorized(request: Request) {
  const configuredToken = process.env.ADMIN_IMPORT_TOKEN;
  const requestToken = request.headers.get("x-admin-import-token");
  return Boolean(configuredToken && requestToken === configuredToken);
}

export function isCronOrAdminAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  return Boolean(
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      isAdminImportTokenAuthorized(request)
  );
}

export function unauthorizedJson() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function isAdminTokenOrRoleAuthorized(request: Request) {
  if (isAdminImportTokenAuthorized(request)) return true;
  return currentUserIsAdmin().catch(() => false);
}
