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

type TargetForm = {
  id?: string;
  source_name: "ticketmaster" | "eventbrite";
  target_type: "city" | "organization" | "venue" | "event";
  target_value: string;
  label: string;
  city: string;
  category: string;
  notes: string;
  active: boolean;
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
  importWindowRange
}: {
  envRows: EnvRow[];
  importWindowLabel: string;
  importWindowRange: string;
}) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<unknown>(null);
  const [targets, setTargets] = useState<SourceTarget[]>([]);
  const [runs, setRuns] = useState<ImportRun[]>([]);
  const [form, setForm] = useState<TargetForm>(emptyForm);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const hasToken = token.trim().length > 0;
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
    if (!hasToken) return setStatus("Add the admin token before loading targets.");
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
    if (!hasToken) return setStatus("Add the admin token before loading import history.");
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

  async function runImport(kind: "ticketmaster" | "eventbrite" | "all") {
    if (!hasToken) return setStatus("Add the admin token before running imports.");
    setLoadingAction(kind);
    setImportResult(null);
    try {
      const json = await fetchJson(`/api/admin/import/${kind}`, { method: "POST" });
      setImportResult(json);
      setStatus(`${kind} import finished.`);
      await refreshRuns();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function submitTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasToken) return setStatus("Add the admin token before saving targets.");
    setLoadingAction("save-target");
    try {
      const path = form.id ? `/api/admin/source-targets/${form.id}` : "/api/admin/source-targets";
      const method = form.id ? "PATCH" : "POST";
      await fetchJson(path, {
        method,
        body: JSON.stringify(form)
      });
      setForm(emptyForm);
      setStatus("Source target saved.");
      await refreshTargets();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function updateTarget(target: SourceTarget, updates: Partial<SourceTarget>) {
    if (!hasToken) return setStatus("Add the admin token before editing targets.");
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
    if (!hasToken) return setStatus("Add the admin token before deleting targets.");
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

  return (
    <div className="stack">
      <section className="detail-panel stack">
        <h2 className="section-title">Admin Token</h2>
        <p className="muted">Stored only in sessionStorage for this browser tab.</p>
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
