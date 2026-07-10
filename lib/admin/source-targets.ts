const allowedSources = ["ticketmaster", "eventbrite", "stubhub"] as const;
const allowedTargetTypes = ["city", "organization", "venue", "event"] as const;

export type SourceTargetPayload = {
  source_name?: unknown;
  target_type?: unknown;
  target_value?: unknown;
  label?: unknown;
  city?: unknown;
  category?: unknown;
  active?: unknown;
  notes?: unknown;
};

function optionalString(value: unknown) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizedString(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function validateSourceTargetPayload(payload: SourceTargetPayload, partial = false) {
  const sourceName = normalizedString(payload.source_name);
  const targetType = normalizedString(payload.target_type);
  const targetValue = optionalString(payload.target_value);
  const errors: string[] = [];

  if (!partial || payload.source_name !== undefined) {
    if (!allowedSources.includes(sourceName as (typeof allowedSources)[number])) {
        errors.push("source_name must be ticketmaster, eventbrite, or stubhub.");
    }
  }

  if (!partial || payload.target_type !== undefined) {
    if (!allowedTargetTypes.includes(targetType as (typeof allowedTargetTypes)[number])) {
      errors.push("target_type must be city, organization, venue, or event.");
    }
  }

  const effectiveSource = sourceName || undefined;
  const effectiveTargetType = targetType || undefined;
  if (effectiveSource === "ticketmaster" && effectiveTargetType && effectiveTargetType !== "city") {
    errors.push("Ticketmaster targets currently support only target_type=city.");
  }
  if (
    effectiveSource === "eventbrite" &&
    effectiveTargetType &&
    !["organization", "venue", "event"].includes(effectiveTargetType)
  ) {
    errors.push("Eventbrite targets support target_type=organization, venue, or event.");
  }
  if (effectiveSource === "stubhub" && effectiveTargetType && !["city", "venue", "event"].includes(effectiveTargetType)) {
    errors.push("StubHub targets support target_type=city, venue, or event.");
  }

  if (!partial || payload.target_value !== undefined) {
    if (!targetValue) errors.push("target_value is required.");
  }

  if (errors.length) {
    return { errors, data: null };
  }

  const data: Record<string, string | boolean | null> = {};

  if (!partial || payload.source_name !== undefined) data.source_name = sourceName;
  if (!partial || payload.target_type !== undefined) data.target_type = targetType;
  if (!partial || payload.target_value !== undefined) data.target_value = targetValue;
  if (payload.label !== undefined) data.label = optionalString(payload.label);
  if (payload.city !== undefined) data.city = optionalString(payload.city);
  if (payload.category !== undefined) data.category = optionalString(payload.category)?.toLowerCase() || null;
  if (payload.notes !== undefined) data.notes = optionalString(payload.notes);
  if (payload.active !== undefined) data.active = Boolean(payload.active);

  return { errors: [], data };
}
