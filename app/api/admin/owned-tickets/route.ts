import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminOwnedTicketListings } from "@/lib/owned-tickets";

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function listingPayload(body: Record<string, unknown>) {
  const price = Number(body.price_per_ticket);
  const quantityTotal = Number(body.quantity_total || 0);
  const quantityAvailable = Number(body.quantity_available || 0);

  if (!body.event_id) throw new Error("event_id is required.");
  if (!Number.isFinite(price) || price < 0) throw new Error("price_per_ticket must be a valid amount.");
  if (!Number.isInteger(quantityTotal) || quantityTotal < 0) throw new Error("quantity_total must be a non-negative integer.");
  if (!Number.isInteger(quantityAvailable) || quantityAvailable < 0) throw new Error("quantity_available must be a non-negative integer.");

  return {
    event_id: String(body.event_id),
    title: cleanString(body.title),
    description: cleanString(body.description),
    quantity_total: quantityTotal,
    quantity_available: quantityAvailable,
    section: cleanString(body.section),
    row_name: cleanString(body.row_name),
    seat_numbers: cleanString(body.seat_numbers),
    price_per_ticket: price,
    currency: cleanString(body.currency) || "USD",
    delivery_method: cleanString(body.delivery_method) || "mobile_transfer",
    listing_status: cleanString(body.listing_status) || "draft",
    public_notes: cleanString(body.public_notes),
    private_notes: cleanString(body.private_notes)
  };
}

export async function GET(request: Request) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  try {
    return NextResponse.json({ listings: await getAdminOwnedTicketListings() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("owned_ticket_listings")
      .insert(listingPayload(body))
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ listing: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
