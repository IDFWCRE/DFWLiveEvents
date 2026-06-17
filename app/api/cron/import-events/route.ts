import { NextResponse } from "next/server";
import { importEventbriteEvents } from "@/lib/eventbrite/importer";
import { importTicketmasterEvents } from "@/lib/ticketmaster/importer";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const adminToken = process.env.ADMIN_IMPORT_TOKEN;
  const importToken = request.headers.get("x-admin-import-token");

  return Boolean(
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (adminToken && importToken === adminToken)
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  const ticketmaster = await importTicketmasterEvents().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Ticketmaster: ${message}`);
    return { fetchedCount: 0, insertedCount: 0, updatedCount: 0, skippedCount: 0, errors: [message] };
  });
  const eventbrite = await importEventbriteEvents().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Eventbrite: ${message}`);
    return { fetchedCount: 0, insertedCount: 0, updatedCount: 0, skippedCount: 0, errors: [message] };
  });

  const combinedErrors = [...errors, ...ticketmaster.errors, ...eventbrite.errors];

  return NextResponse.json({
    ticketmaster,
    eventbrite,
    totalFetched: ticketmaster.fetchedCount + eventbrite.fetchedCount,
    totalInserted: ticketmaster.insertedCount + eventbrite.insertedCount,
    totalUpdated: ticketmaster.updatedCount + eventbrite.updatedCount,
    totalSkipped: ticketmaster.skippedCount + eventbrite.skippedCount,
    errors: combinedErrors
  });
}
