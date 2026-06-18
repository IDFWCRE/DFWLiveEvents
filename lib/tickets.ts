const externalTicketSources = new Set([
  "ticketmaster",
  "ticketweb",
  "eventbrite",
  "axs",
  "seatgeek",
  "stubhub",
  "vivid seats",
  "ticketnetwork"
]);

const internalTicketSources = new Set([
  "dfw live events",
  "internal",
  "owned inventory",
  "reseller"
]);

export function isExternalTicketOffer(sourceName?: string | null) {
  const normalized = sourceName?.trim().toLowerCase();
  if (!normalized) return false;
  if (internalTicketSources.has(normalized)) return false;
  return externalTicketSources.has(normalized);
}
