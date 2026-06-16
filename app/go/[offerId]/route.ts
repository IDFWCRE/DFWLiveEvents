import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;

  try {
    const supabase = createSupabaseAdminClient();
    const { data: offer, error } = await supabase
      .from("event_offers")
      .select("id, event_id, source_name, source_listing_url, affiliate_url, available")
      .eq("id", offerId)
      .eq("available", true)
      .single();

    if (error || !offer) {
      return NextResponse.redirect(new URL("/events", request.url));
    }

    const destinationUrl = offer.affiliate_url || offer.source_listing_url;

    await supabase.from("affiliate_clicks").insert({
      event_id: offer.event_id,
      event_offer_id: offer.id,
      source_name: offer.source_name,
      destination_url: destinationUrl,
      referrer: request.headers.get("referer"),
      user_agent: request.headers.get("user-agent")
    });

    return NextResponse.redirect(destinationUrl);
  } catch {
    return NextResponse.redirect(new URL("/events", request.url));
  }
}
