import { NextResponse } from "next/server";
import { importEventbriteEvents } from "@/lib/eventbrite/importer";

export async function POST(request: Request) {
  const configuredToken = process.env.ADMIN_IMPORT_TOKEN;
  const requestToken = request.headers.get("x-admin-import-token");

  if (!configuredToken || requestToken !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await importEventbriteEvents();
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
