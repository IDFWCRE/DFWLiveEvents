import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getSafeRedirectUrl(affiliateUrl: string | null, sourceListingUrl: string | null) {
  const candidate = affiliateUrl?.trim() || sourceListingUrl?.trim();

  if (!candidate || !/^https?:\/\//i.test(candidate)) {
    return null;
  }

  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  console.log(`[go] offerId received: ${offerId}`);

  const supabase = createSupabaseAdminClient();
  const { data: offer, error } = await supabase
    .from("event_offers")
    .select("id, event_id, source_name, source_listing_url, affiliate_url, available")
    .eq("id", offerId)
    .maybeSingle();

  console.log(`[go] offer found: ${offer ? "yes" : "no"}`);

  if (error) {
    console.error("[go] offer lookup failed:", error.message);
    return jsonError("Ticket offer lookup failed.", 500);
  }

  if (!offer) {
    return jsonError("Ticket offer not found.", 404);
  }

  console.log(`[go] source_name: ${offer.source_name || "unknown"}`);

  const redirectUrl = getSafeRedirectUrl(offer.affiliate_url, offer.source_listing_url);

  if (!redirectUrl) {
    console.error(`[go] invalid ticket URL for offerId: ${offerId}`);
    return jsonError("Ticket URL is missing or invalid.", 400);
  }

  console.log(`[go] redirect target host: ${redirectUrl.host}`);

  const { error: clickError } = await supabase.from("affiliate_clicks").insert({
    event_id: offer.event_id,
    event_offer_id: offer.id,
    source_name: offer.source_name,
    destination_url: redirectUrl.toString(),
    referrer: request.headers.get("referer"),
    user_agent: request.headers.get("user-agent")
  });

  if (clickError) {
    console.error("[go] click tracking failed:", clickError.message);
  } else {
    console.log("[go] click tracking success");
  }

  return NextResponse.redirect(redirectUrl, 302);
}
