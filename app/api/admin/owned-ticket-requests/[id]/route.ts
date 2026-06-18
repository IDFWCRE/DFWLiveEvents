import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedStatuses = ["pending", "contacted", "approved", "rejected", "cancelled", "fulfilled"];

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) || {};
  const status = String(body.status || "");
  const adminNotes = body.admin_notes === undefined ? undefined : String(body.admin_notes || "").trim();

  if (status && !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid request status." }, { status: 400 });
  }

  const payload: Record<string, string | null> = {};
  if (status) payload.status = status;
  if (adminNotes !== undefined) payload.admin_notes = adminNotes || null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("owned_ticket_requests")
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}
