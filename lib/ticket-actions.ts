"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserWithProfile } from "@/lib/auth/profiles";
import { getActiveOwnedTicketListingById } from "@/lib/owned-tickets";

export async function submitOwnedTicketRequestAction(formData: FormData) {
  const listingId = String(formData.get("listing_id") || "");
  const quantityRequested = Number(formData.get("quantity_requested") || 1);
  const buyerPhone = String(formData.get("buyer_phone") || "").trim();
  const buyerMessage = String(formData.get("buyer_message") || "").trim();
  const { user, profile } = await getCurrentUserWithProfile();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/tickets/${listingId}`)}`);
  }

  const { data: listing, error } = await getActiveOwnedTicketListingById(listingId);
  if (error || !listing) {
    redirect(`/tickets/${listingId}?error=Ticket%20listing%20is%20not%20available.`);
  }

  if (!Number.isInteger(quantityRequested) || quantityRequested < 1 || quantityRequested > listing.quantityAvailable) {
    redirect(`/tickets/${listingId}?error=Requested%20quantity%20is%20not%20available.`);
  }

  const supabase = createSupabaseAdminClient();
  const { error: insertError } = await supabase.from("owned_ticket_requests").insert({
    listing_id: listing.id,
    event_id: listing.eventId,
    buyer_user_id: user.id,
    buyer_email: user.email,
    buyer_name: profile?.full_name || user.user_metadata?.full_name || null,
    buyer_phone: buyerPhone || null,
    quantity_requested: quantityRequested,
    buyer_message: buyerMessage || null,
    status: "pending"
  });

  if (insertError) {
    redirect(`/tickets/${listingId}?error=${encodeURIComponent(insertError.message)}`);
  }

  redirect(`/tickets/${listingId}?message=${encodeURIComponent("Your ticket request has been submitted. We will contact you to confirm availability and payment details.")}`);
}
