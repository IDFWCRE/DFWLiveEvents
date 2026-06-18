import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function patchPayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  const stringFields = ["event_id", "title", "description", "section", "row_name", "seat_numbers", "currency", "delivery_method", "listing_status", "public_notes", "private_notes"];
  for (const field of stringFields) {
    if (body[field] !== undefined) payload[field] = cleanString(body[field]);
  }
  for (const field of ["quantity_total", "quantity_available"]) {
    if (body[field] !== undefined) {
      const value = Number(body[field]);
      if (!Number.isInteger(value) || value < 0) throw new Error(`${field} must be a non-negative integer.`);
      payload[field] = value;
    }
  }
  if (body.price_per_ticket !== undefined) {
    const value = Number(body.price_per_ticket);
    if (!Number.isFinite(value) || value < 0) throw new Error("price_per_ticket must be a valid amount.");
    payload.price_per_ticket = value;
  }
  return payload;
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("owned_ticket_listings")
      .update(patchPayload(body))
      .eq("id", id)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ listing: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();
  const { count, error: countError } = await supabase
    .from("owned_ticket_requests")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count || 0) > 0) {
    const { error } = await supabase
      .from("owned_ticket_listings")
      .update({ listing_status: "inactive" })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, softDeleted: true });
  }

  const { error } = await supabase.from("owned_ticket_listings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, softDeleted: false });
}
