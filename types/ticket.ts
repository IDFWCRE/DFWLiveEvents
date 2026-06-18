import type { Event } from "@/types/event";

export type OwnedTicketListingStatus = "draft" | "active" | "inactive" | "sold_out";
export type OwnedTicketRequestStatus = "pending" | "contacted" | "approved" | "rejected" | "cancelled" | "fulfilled";

export type OwnedTicketListing = {
  id: string;
  eventId: string;
  title: string | null;
  description: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  section: string | null;
  rowName: string | null;
  seatNumbers: string | null;
  pricePerTicket: number;
  currency: string;
  deliveryMethod: string;
  listingStatus: OwnedTicketListingStatus;
  publicNotes: string | null;
  privateNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  event?: Event;
};

export type OwnedTicketRequest = {
  id: string;
  listingId: string;
  eventId: string;
  buyerUserId: string | null;
  buyerEmail: string | null;
  buyerName: string | null;
  buyerPhone: string | null;
  quantityRequested: number;
  status: OwnedTicketRequestStatus;
  buyerMessage: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  listing?: OwnedTicketListing;
  event?: Event;
};
