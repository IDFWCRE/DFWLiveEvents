import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ImportRunRow = {
  id: string;
  source_name: string;
  provider?: string | null;
  run_type: string;
  trigger_type?: string | null;
  status: string;
  success?: boolean | null;
  started_at: string;
  finished_at: string | null;
  duration_ms?: number | null;
  fetched_count: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  error_message?: string | null;
  errors?: unknown;
  summary?: unknown;
};

const visibleProviders = ["ticketmaster", "eventbrite", "stubhub"];

function providerForRun(run: ImportRunRow) {
  return (run.provider || run.source_name).toLowerCase();
}

function errorsForRun(run: ImportRunRow) {
  if (Array.isArray(run.errors)) return run.errors.map(String);
  if (run.summary && typeof run.summary === "object" && Array.isArray((run.summary as { errors?: unknown }).errors)) {
    return ((run.summary as { errors: unknown[] }).errors || []).map(String);
  }
  return run.error_message ? [run.error_message] : [];
}

function diagnosticsForRun(run: ImportRunRow) {
  if (!run.summary || typeof run.summary !== "object") return null;
  const summary = run.summary as {
    sourceCounts?: Record<string, number>;
    promoterCounts?: Record<string, number>;
    likelyLiveNationPromotedCount?: number;
  };
  const sourceCounts = summary.sourceCounts || null;
  const likelyLiveNationPromotedCount = summary.likelyLiveNationPromotedCount;

  if (!sourceCounts && likelyLiveNationPromotedCount === undefined) return null;

  return {
    sourceCounts,
    likelyLiveNationPromotedCount: likelyLiveNationPromotedCount || 0
  };
}

function buildProviderStatuses(runs: ImportRunRow[]) {
  return visibleProviders.map((provider) => {
    const providerRuns = runs.filter((run) => providerForRun(run) === provider);
    const lastAttempt = providerRuns[0] || null;
    const lastSuccess = providerRuns.find((run) => run.success === true || run.status === "success") || null;
    const errors = lastAttempt ? errorsForRun(lastAttempt) : [];
    const diagnostics = lastAttempt ? diagnosticsForRun(lastAttempt) : null;

    return {
      provider,
      last_attempted_sync: lastAttempt?.started_at || null,
      last_successful_sync: lastSuccess?.finished_at || lastSuccess?.started_at || null,
      last_status: lastAttempt?.status || null,
      last_trigger_type: lastAttempt?.trigger_type || lastAttempt?.run_type || null,
      duration_ms: lastAttempt?.duration_ms || null,
      fetched_count: lastAttempt?.fetched_count || 0,
      inserted_count: lastAttempt?.inserted_count || 0,
      updated_count: lastAttempt?.updated_count || 0,
      skipped_count: lastAttempt?.skipped_count || 0,
      error_count: lastAttempt?.error_count || 0,
      last_error: errors[0] || null,
      diagnostics
    };
  });
}

export async function GET(request: Request) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  const url = new URL(request.url);
  const sourceName = url.searchParams.get("source_name");
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("source_import_runs")
    .select(
      "id, source_name, provider, run_type, trigger_type, status, success, import_window_start, import_window_end, started_at, finished_at, duration_ms, fetched_count, inserted_count, updated_count, skipped_count, error_count, error_message, errors, summary, triggered_by, created_at"
    )
    .order("started_at", { ascending: false })
    .limit(50);

  if (sourceName) {
    query = query.eq("source_name", sourceName);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const runs = (data || []) as ImportRunRow[];
  return NextResponse.json({
    runs: runs.map((run) => ({ ...run, diagnostics: diagnosticsForRun(run) })),
    providerStatuses: buildProviderStatuses(runs)
  });
}
