import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { getAdminOwnedTicketRequests } from "@/lib/owned-tickets";

export async function GET(request: Request) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  try {
    return NextResponse.json({ requests: await getAdminOwnedTicketRequests() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
