import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { importStubHubEvents } from "@/lib/stubhub/importer";

export async function POST(request: Request) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  try {
    const summary = await importStubHubEvents({ runType: "manual_api", triggeredBy: "admin_api" });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        fetchedCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
