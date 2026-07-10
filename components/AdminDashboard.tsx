"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EnvRow = [string, string];

type SourceTarget = {
  id: string;
  source_name: string;
  target_type: string;
  target_value: string;
  label: string | null;
  city: string | null;
  category: string | null;
  active: boolean;
  notes: string | null;
};

type ImportRun = {
  id: string;
  source_name: string;
  run_type: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  fetched_count: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
};

type ResellerApplication = {
  id: string;
  user_id: string;
  business_name: string | null;
  display_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  verification_status: string;
  terms_accepted_at: string | null;
  created_at: string;
};

type AdminEventOption = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venues: { name: string; city: string } | Array<{ name: string; city: string }> | null;
};

type OwnedListing = {
  id: string;
  eventId: string;
  title: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  section: string | null;
  rowName: string | null;
  pricePerTicket: number;
  currency: string;
  deliveryMethod: string;
  listingStatus: string;
  event?: { name: string; city: string };
};

type OwnedRequest = {
  id: string;
  buyerEmail: string | null;
  buyerName: string | null;
  quantityRequested: number;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  event?: { name: string; city: string };
  listing?: { pricePerTicket: number; currency: string };
};

type TargetForm = {
  id?: string;
  source_name: "ticketmaster" | "eventbrite" | "stubhub";
  target_type: "city" | "organization" | "venue" | "event";
  target_value: string;
  label: string;
  city: string;
  category: string;
  notes: string;
  active: boolean;
};

type OwnedListingForm = {
  id?: string;
  event_id: string;
  title: string;
  description: string;
  quantity_total: number;
  quantity_available: number;
  section: string;
  row_name: string;
  seat_numbers: string;
  price_per_ticket: string;
  currency: string;
  delivery_method: string;
  listing_status: string;
  public_notes: string;
  private_notes: string;
};

const emptyForm: TargetForm = {
  source_name: "eventbrite",
  target_type: "event",
  target_value: "",
  label: "",
  city: "",
  category: "",
  notes: "",
  active: true
};

const emptyOwnedListingForm: OwnedListingForm = {
  event_id: "",
  title: "",
  description: "",
  quantity_total: 0,
  quantity_available: 0,
  section: "",
  row_name: "",
  seat_numbers: "",
  price_per_ticket: "",
  currency: "USD",
  delivery_method: "mobile_transfer",
  listing_status: "draft",
  public_notes: "",
  private_notes: ""
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function duration(startedAt: string, finishedAt: string | null) {
  if (!finishedAt) return "Running";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "-";
  return `${Math.round(ms / 1000)}s`;
}

export function AdminDashboard({
  envRows,
  importWindowLabel,
  importWindowRange,
  isAdminSession = false
}: {
  envRows: EnvRow[];
  importWindowLabel: string;
  importWindowRange: string;
  isAdminSession?: boolean;
}) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<unknown>(null);
  const [targets, setTargets] = useState<SourceTarget[]>([]);
  const [runs, setRuns] = useState<ImportRun[]>([]);
  const [resellers, setResellers] = useState<ResellerApplication[]>([]);
  const [events, setEvents] = useState<AdminEventOption[]>([]);
  const [ownedListings, setOwnedListings] = useState<OwnedListing[]>([]);
  const [ownedRequests, setOwnedRequests] = useState<OwnedRequest[]>([]);
  const [form, setForm] = useState<TargetForm>(emptyForm);
  const [ownedForm, setOwnedForm] = useState<OwnedListingForm>(emptyOwnedListingForm);
  const [eventSearch, setEventSearch] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const hasAdminAccess = isAdminSession || token.trim().length > 0;
  const authHeaders = useMemo(() => ({ "x-admin-import-token": token.trim() }), [token]);

  useEffect(() => {
    setToken(sessionStorage.getItem("dfw-admin-import-token") || "");
  }, []);

  function saveToken(value: string) {
    setToken(value);
    if (value.trim()) {
      sessionStorage.setItem("dfw-admin-import-token", value.trim());
    } else {
      sessionStorage.removeItem("dfw-admin-import-token");
    }
  }

  async function fetchJson(path: string, init: RequestInit = {}) {
    const response = await fetch(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...authHeaders,
        ...(init.headers || {})
      }
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.error || `Request failed with ${response.status}`);
    }
    return json;
  }

  async function refreshTargets() {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before loading targets.");
    setLoadingAction("targets");
    try {
      const json = await fetchJson("/api/admin/source-targets");
      setTargets(json.targets || []);
      setStatus("Source targets refreshed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function refreshRuns() {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before loading import history.");
    setLoadingAction("history");
    try {
      const json = await fetchJson("/api/admin/import-runs");
      setRuns(json.runs || []);
      setStatus("Import history refreshed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function refreshResellers() {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before loading reseller applications.");
    setLoadingAction("resellers");
    try {
      const json = await fetchJson("/api/admin/resellers");
      setResellers(json.applications || []);
      setStatus("Reseller applications refreshed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function refreshOwnedInventory() {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before loading owned tickets.");
    setLoadingAction("owned");
    try {
      const [eventsJson, listingsJson, requestsJson] = await Promise.all([
        fetchJson("/api/admin/events"),
        fetchJson("/api/admin/owned-tickets"),
        fetchJson("/api/admin/owned-ticket-requests")
      ]);
      setEvents(eventsJson.events || []);
      setOwnedListings(listingsJson.listings || []);
      setOwnedRequests(requestsJson.requests || []);
      setStatus("Owned ticket inventory refreshed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function updateReseller(id: string, action: "approve" | "reject" | "suspend") {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before updating reseller applications.");
    setLoadingAction(id);
    try {
      await fetchJson(`/api/admin/resellers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action })
      });
      setStatus(`Reseller ${action} action saved.`);
      await refreshResellers();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function runImport(kind: "ticketmaster" | "eventbrite" | "stubhub" | "all") {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before running imports.");
    setLoadingAction(kind);
    setImportResult(null);
    try {
      const json = await fetchJson(`/api/admin/import/${kind}`, { method: "POST" });
      setImportResult(json);
      const errorCount = Array.isArray(json.errors) ? json.errors.length : Array.isArray(json?.errors) ? json.errors.length : 0;
      setStatus(errorCount ? `${kind} import finished with ${errorCount} error(s).` : `${kind} import finished.`);
      await refreshRuns();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function submitTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before saving targets.");
    setLoadingAction("save-target");
    try {
      const path = form.id ? `/api/admin/source-targets/${form.id}` : "/api/admin/source-targets";
      const method = form.id ? "PATCH" : "POST";
      await fetchJson(path, {
        method,
        body: JSON.stringify(form)
      });
      const wasEventbriteEventTarget = form.source_name === "eventbrite" && form.target_type === "event";
      setForm(emptyForm);
      setStatus(wasEventbriteEventTarget ? "Eventbrite event target saved. URLs are stored as event IDs." : "Source target saved.");
      await refreshTargets();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function submitOwnedListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before saving owned ticket listings.");
    setLoadingAction("save-owned");
    try {
      const path = ownedForm.id ? `/api/admin/owned-tickets/${ownedForm.id}` : "/api/admin/owned-tickets";
      const method = ownedForm.id ? "PATCH" : "POST";
      await fetchJson(path, {
        method,
        body: JSON.stringify(ownedForm)
      });
      setOwnedForm(emptyOwnedListingForm);
      setStatus("Owned ticket listing saved.");
      await refreshOwnedInventory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function updateOwnedListing(id: string, updates: Record<string, unknown>) {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before editing owned ticket listings.");
    setLoadingAction(id);
    try {
      await fetchJson(`/api/admin/owned-tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates)
      });
      setStatus("Owned ticket listing updated.");
      await refreshOwnedInventory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function deleteOwnedListing(id: string) {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before deleting owned ticket listings.");
    setLoadingAction(id);
    try {
      await fetchJson(`/api/admin/owned-tickets/${id}`, { method: "DELETE" });
      setStatus("Owned ticket listing deleted or deactivated.");
      await refreshOwnedInventory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function updateOwnedRequest(id: string, status: string, adminNotes?: string | null) {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before editing owned ticket requests.");
    setLoadingAction(id);
    try {
      await fetchJson(`/api/admin/owned-ticket-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, admin_notes: adminNotes })
      });
      setStatus("Ticket request updated.");
      await refreshOwnedInventory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function updateTarget(target: SourceTarget, updates: Partial<SourceTarget>) {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before editing targets.");
    setLoadingAction(target.id);
    try {
      await fetchJson(`/api/admin/source-targets/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates)
      });
      setStatus("Source target updated.");
      await refreshTargets();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function deleteTarget(id: string) {
    if (!hasAdminAccess) return setStatus("Admin session or admin token required before deleting targets.");
    setLoadingAction(id);
    try {
      await fetchJson(`/api/admin/source-targets/${id}`, { method: "DELETE" });
      setStatus("Source target deleted.");
      await refreshTargets();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  function editTarget(target: SourceTarget) {
    setForm({
      id: target.id,
      source_name: target.source_name as TargetForm["source_name"],
      target_type: target.target_type as TargetForm["target_type"],
      target_value: target.target_value,
      label: target.label || "",
      city: target.city || "",
      category: target.category || "",
      notes: target.notes || "",
      active: target.active
    });
  }

  function editOwnedListing(listing: OwnedListing) {
    setOwnedForm({
      id: listing.id,
      event_id: listing.eventId,
      title: listing.title || "",
      description: "",
      quantity_total: listing.quantityTotal,
      quantity_available: listing.quantityAvailable,
      section: listing.section || "",
      row_name: listing.rowName || "",
      seat_numbers: "",
      price_per_ticket: String(listing.pricePerTicket),
      currency: listing.currency,
      delivery_method: listing.deliveryMethod,
      listing_status: listing.listingStatus,
      public_notes: "",
      private_notes: ""
    });
  }

  const filteredEvents = events.filter((event) => {
    const venue = Array.isArray(event.venues) ? event.venues[0] : event.venues;
    const haystack = `${event.title} ${venue?.name || ""} ${venue?.city || ""} ${event.event_date}`.toLowerCase();
    return haystack.includes(eventSearch.toLowerCase());
  });

  return (
    <div className="stack">
      <section className="detail-panel stack">
        <h2 className="section-title">Admin Token</h2>
        <p className="muted">
          {isAdminSession
            ? "You are signed in as an admin. Token is optional for API/curl testing."
            : "Stored only in sessionStorage for this browser tab."}
        </p>
        <div className="admin-inline">
          <input
            className="admin-input"
            type="password"
            value={token}
            placeholder="ADMIN_IMPORT_TOKEN"
            onChange={(event) => saveToken(event.target.value)}
          />
          <button className="primary-button" type="button" onClick={() => saveToken("")}>
            Clear token
          </button>
        </div>
        {status ? <p className="muted">{status}</p> : null}
      </section>

      <section className="detail-panel stack">
        <h2 className="section-title">Import Controls</h2>
        <p className="muted">
          Import window: {importWindowLabel} ({importWindowRange})
        </p>
        <div className="admin-actions">
          <button className="primary-button" disabled={Boolean(loadingAction)} onClick={() => runImport("ticketmaster")}>
            {loadingAction === "ticketmaster" ? "Running..." : "Run Ticketmaster Import"}
          </button>
          <button className="primary-button" disabled={Boolean(loadingAction)} onClick={() => runImport("eventbrite")}>
            {loadingAction === "eventbrite" ? "Running..." : "Run Eventbrite Import"}
          </button>
          <button className="primary-button" disabled={Boolean(loadingAction)} onClick={() => runImport("stubhub")}>
            {loadingAction === "stubhub" ? "Running..." : "Run StubHub Import"}
          </button>
          <button className="primary-button" disabled={Boolean(loadingAction)} onClick={() => runImport("all")}>
            {loadingAction === "all" ? "Running..." : "Run All Imports"}
          </button>
        </div>
        {importResult ? <pre className="code-block">{JSON.stringify(importResult, null, 2)}</pre> : null}
      </section>

      <section className="detail-panel stack">
        <div className="admin-section-head">
          <h2 className="section-title">Source Targets</h2>
          <button className="primary-button" type="button" onClick={refreshTargets}>
            {loadingAction === "targets" ? "Loading..." : "Refresh Targets"}
          </button>
        </div>
        <form className="admin-form" onSubmit={submitTarget}>
          <select
            className="admin-input"
            value={form.source_name}
            onChange={(event) => setForm({ ...form, source_name: event.target.value as TargetForm["source_name"] })}
          >
            <option value="eventbrite">Eventbrite</option>
            <option value="ticketmaster">Ticketmaster</option>
            <option value="stubhub">StubHub</option>
          </select>
          <select
            className="admin-input"
            value={form.target_type}
            onChange={(event) => setForm({ ...form, target_type: event.target.value as TargetForm["target_type"] })}
          >
            <option value="city">City</option>
            <option value="organization">Organization</option>
            <option value="venue">Venue</option>
            <option value="event">Event</option>
          </select>
          <input className="admin-input" value={form.target_value} placeholder="Target value" onChange={(event) => setForm({ ...form, target_value: event.target.value })} />
          <input className="admin-input" value={form.label} placeholder="Label" onChange={(event) => setForm({ ...form, label: event.target.value })} />
          <input className="admin-input" value={form.city} placeholder="City" onChange={(event) => setForm({ ...form, city: event.target.value })} />
          <input className="admin-input" value={form.category} placeholder="Category" onChange={(event) => setForm({ ...form, category: event.target.value })} />
          <input className="admin-input admin-wide" value={form.notes} placeholder="Notes" onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <label className="admin-checkbox">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            Active
          </label>
          <button className="primary-button" disabled={loadingAction === "save-target"} type="submit">
            {form.id ? "Update Target" : "Add Target"}
          </button>
          {form.id ? (
            <button className="filter-button" type="button" onClick={() => setForm(emptyForm)}>
              Cancel edit
            </button>
          ) : null}
        </form>
        <p className="muted">
          Eventbrite event targets accept full event URLs or numeric event IDs. Organization and venue targets only import events that
          EVENTBRITE_PRIVATE_TOKEN can access or manage.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Type</th>
                <th>Value</th>
                <th>City</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((target) => (
                <tr key={target.id}>
                  <td>{target.source_name}</td>
                  <td>{target.target_type}</td>
                  <td>{target.label || target.target_value}</td>
                  <td>{target.city || "-"}</td>
                  <td>{target.active ? "Yes" : "No"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="filter-button" type="button" onClick={() => editTarget(target)}>Edit</button>
                      <button className="filter-button" type="button" onClick={() => updateTarget(target, { active: !target.active })}>
                        {target.active ? "Deactivate" : "Reactivate"}
                      </button>
                      <button className="filter-button" type="button" onClick={() => deleteTarget(target.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-panel stack">
        <div className="admin-section-head">
          <h2 className="section-title">Import History</h2>
          <button className="primary-button" type="button" onClick={refreshRuns}>
            {loadingAction === "history" ? "Loading..." : "Refresh History"}
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Source</th>
                <th>Type</th>
                <th>Status</th>
                <th>Fetched</th>
                <th>Inserted</th>
                <th>Updated</th>
                <th>Skipped</th>
                <th>Errors</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td>{formatDate(run.started_at)}</td>
                  <td>{run.source_name}</td>
                  <td>{run.run_type}</td>
                  <td><span className={`status-pill status-${run.status}`}>{run.status}</span></td>
                  <td>{run.fetched_count}</td>
                  <td>{run.inserted_count}</td>
                  <td>{run.updated_count}</td>
                  <td>{run.skipped_count}</td>
                  <td>{run.error_count}</td>
                  <td>{duration(run.started_at, run.finished_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-panel stack">
        <div className="admin-section-head">
          <h2 className="section-title">Reseller Applications</h2>
          <button className="primary-button" type="button" onClick={refreshResellers}>
            {loadingAction === "resellers" ? "Loading..." : "Refresh Resellers"}
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Business</th>
                <th>Display</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resellers.map((application) => (
                <tr key={application.id}>
                  <td>{formatDate(application.created_at)}</td>
                  <td>{application.business_name || "-"}</td>
                  <td>{application.display_name || "-"}</td>
                  <td>{application.contact_email || "-"}</td>
                  <td><span className={`status-pill status-${application.verification_status}`}>{application.verification_status}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="filter-button" type="button" onClick={() => updateReseller(application.id, "approve")}>Approve</button>
                      <button className="filter-button" type="button" onClick={() => updateReseller(application.id, "reject")}>Reject</button>
                      <button className="filter-button" type="button" onClick={() => updateReseller(application.id, "suspend")}>Suspend</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-panel stack">
        <div className="admin-section-head">
          <h2 className="section-title">Owned Tickets</h2>
          <button className="primary-button" type="button" onClick={refreshOwnedInventory}>
            {loadingAction === "owned" ? "Loading..." : "Refresh Owned Tickets"}
          </button>
        </div>
        <form className="admin-form" onSubmit={submitOwnedListing}>
          <input className="admin-input admin-wide" value={eventSearch} placeholder="Search events by title, venue, city, date" onChange={(event) => setEventSearch(event.target.value)} />
          <select className="admin-input admin-wide" value={ownedForm.event_id} onChange={(event) => setOwnedForm({ ...ownedForm, event_id: event.target.value })} required>
            <option value="">Select event</option>
            {filteredEvents.map((event) => {
              const venue = Array.isArray(event.venues) ? event.venues[0] : event.venues;
              return <option value={event.id} key={event.id}>{event.title} · {venue?.name || "Venue"} · {venue?.city || "DFW"} · {event.event_date}</option>;
            })}
          </select>
          <input className="admin-input" value={ownedForm.title} placeholder="Listing title" onChange={(event) => setOwnedForm({ ...ownedForm, title: event.target.value })} />
          <input className="admin-input" value={ownedForm.price_per_ticket} placeholder="Price per ticket" onChange={(event) => setOwnedForm({ ...ownedForm, price_per_ticket: event.target.value })} required />
          <input className="admin-input" type="number" value={ownedForm.quantity_total} placeholder="Quantity total" onChange={(event) => setOwnedForm({ ...ownedForm, quantity_total: Number(event.target.value) })} />
          <input className="admin-input" type="number" value={ownedForm.quantity_available} placeholder="Quantity available" onChange={(event) => setOwnedForm({ ...ownedForm, quantity_available: Number(event.target.value) })} />
          <input className="admin-input" value={ownedForm.section} placeholder="Section" onChange={(event) => setOwnedForm({ ...ownedForm, section: event.target.value })} />
          <input className="admin-input" value={ownedForm.row_name} placeholder="Row" onChange={(event) => setOwnedForm({ ...ownedForm, row_name: event.target.value })} />
          <input className="admin-input" value={ownedForm.seat_numbers} placeholder="Seat numbers" onChange={(event) => setOwnedForm({ ...ownedForm, seat_numbers: event.target.value })} />
          <select className="admin-input" value={ownedForm.delivery_method} onChange={(event) => setOwnedForm({ ...ownedForm, delivery_method: event.target.value })}>
            <option value="mobile_transfer">Mobile transfer</option>
            <option value="pdf">PDF</option>
            <option value="will_call">Will call</option>
            <option value="physical">Physical</option>
            <option value="tbd">TBD</option>
          </select>
          <select className="admin-input" value={ownedForm.listing_status} onChange={(event) => setOwnedForm({ ...ownedForm, listing_status: event.target.value })}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="sold_out">Sold out</option>
          </select>
          <input className="admin-input admin-wide" value={ownedForm.public_notes} placeholder="Public notes" onChange={(event) => setOwnedForm({ ...ownedForm, public_notes: event.target.value })} />
          <input className="admin-input admin-wide" value={ownedForm.private_notes} placeholder="Private notes" onChange={(event) => setOwnedForm({ ...ownedForm, private_notes: event.target.value })} />
          <button className="primary-button" disabled={loadingAction === "save-owned"} type="submit">{ownedForm.id ? "Update Listing" : "Add Listing"}</button>
          {ownedForm.id ? <button className="filter-button" type="button" onClick={() => setOwnedForm(emptyOwnedListingForm)}>Cancel edit</button> : null}
        </form>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Event</th><th>Qty</th><th>Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {ownedListings.map((listing) => (
                <tr key={listing.id}>
                  <td>{listing.event?.name || listing.title || "Listing"}</td>
                  <td>{listing.quantityAvailable}/{listing.quantityTotal}</td>
                  <td>${listing.pricePerTicket.toFixed(2)}</td>
                  <td><span className={`status-pill status-${listing.listingStatus}`}>{listing.listingStatus}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="filter-button" type="button" onClick={() => editOwnedListing(listing)}>Edit</button>
                      <button className="filter-button" type="button" onClick={() => updateOwnedListing(listing.id, { listing_status: listing.listingStatus === "active" ? "inactive" : "active" })}>{listing.listingStatus === "active" ? "Deactivate" : "Activate"}</button>
                      <button className="filter-button" type="button" onClick={() => updateOwnedListing(listing.id, { listing_status: "sold_out", quantity_available: 0 })}>Sold Out</button>
                      <button className="filter-button" type="button" onClick={() => deleteOwnedListing(listing.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-panel stack">
        <h2 className="section-title">Owned Ticket Requests</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Created</th><th>Event</th><th>Buyer</th><th>Qty</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {ownedRequests.map((request) => (
                <tr key={request.id}>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>{request.event?.name || "Event"}</td>
                  <td>{request.buyerName || request.buyerEmail || "-"}</td>
                  <td>{request.quantityRequested}</td>
                  <td><span className={`status-pill status-${request.status}`}>{request.status}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      {["pending", "contacted", "approved", "rejected", "cancelled", "fulfilled"].map((status) => (
                        <button className="filter-button" key={status} type="button" onClick={() => updateOwnedRequest(request.id, status, request.adminNotes)}>{status}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-panel stack">
        <h2 className="section-title">Environment Status</h2>
        <div className="env-table">
          {envRows.map(([name, ready]) => (
            <div className="env-row" key={name}>
              <span>{name}</span>
              <strong>{ready}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
