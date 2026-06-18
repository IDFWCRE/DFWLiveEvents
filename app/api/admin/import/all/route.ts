import { NextResponse } from "next/server";
import { isAdminImportTokenAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { importAllSources } from "@/lib/import/all";

export async function POST(request: Request) {
  if (!isAdminImportTokenAuthorized(request)) {
    return unauthorizedJson();
  }

  try {
    const summary = await importAllSources({ runType: "manual_api", triggeredBy: "admin_api" });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        ticketmaster: null,
        eventbrite: null,
        totalFetched: 0,
        totalInserted: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
