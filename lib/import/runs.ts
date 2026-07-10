import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getImportWindow } from "@/lib/import/window";

export type ImportRunStatus = "running" | "success" | "partial_success" | "failed";
export type ImportRunType = "local" | "manual_api" | "cron" | "admin_button";

export type ImportSummaryCounts = {
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
};

export type ImportRunOptions = {
  sourceName: "ticketmaster" | "eventbrite" | "all" | string;
  runType: ImportRunType;
  triggeredBy?: string;
};

function getTriggerType(options: ImportRunOptions) {
  if (options.runType === "cron") return "cron";
  if (options.runType === "manual_api" || options.runType === "admin_button" || options.triggeredBy === "admin_api") {
    return "admin";
  }
  return "manual";
}

export function getSummaryStatus(summary: ImportSummaryCounts): Exclude<ImportRunStatus, "running"> {
  if (!summary.errors.length) return "success";
  const didAnyWork =
    summary.fetchedCount > 0 ||
    summary.insertedCount > 0 ||
    summary.updatedCount > 0 ||
    summary.skippedCount > 0;
  return didAnyWork ? "partial_success" : "failed";
}

export async function startImportRun(options: ImportRunOptions) {
  const supabase = createSupabaseAdminClient();
  const importWindow = getImportWindow();
  const { data, error } = await supabase
    .from("source_import_runs")
    .insert({
      source_name: options.sourceName,
      provider: options.sourceName,
      run_type: options.runType,
      trigger_type: getTriggerType(options),
      status: "running",
      success: false,
      import_window_start: importWindow.startIso,
      import_window_end: importWindow.endIso,
      triggered_by: options.triggeredBy || null
    })
    .select("id, started_at")
    .single();

  if (error) {
    throw new Error(`Unable to create import run record: ${error.message}`);
  }

  return { id: String(data.id), startedAt: String(data.started_at) };
}

export async function finishImportRun(run: { id: string; startedAt: string }, summary: ImportSummaryCounts) {
  const supabase = createSupabaseAdminClient();
  const status = getSummaryStatus(summary);
  const errorMessage = summary.errors.length ? summary.errors.slice(0, 5).join("\n") : null;
  const finishedAt = new Date();
  const startedAtMs = new Date(run.startedAt).getTime();
  const durationMs = Number.isFinite(startedAtMs) ? Math.max(0, finishedAt.getTime() - startedAtMs) : null;

  const { error } = await supabase
    .from("source_import_runs")
    .update({
      status,
      success: status === "success",
      finished_at: finishedAt.toISOString(),
      duration_ms: durationMs,
      fetched_count: summary.fetchedCount,
      inserted_count: summary.insertedCount,
      updated_count: summary.updatedCount,
      skipped_count: summary.skippedCount,
      error_count: summary.errors.length,
      error_message: errorMessage,
      errors: summary.errors,
      summary
    })
    .eq("id", run.id);

  if (error) {
    throw new Error(`Unable to update import run record: ${error.message}`);
  }

  return status;
}

export async function failImportRun(
  run: { id: string; startedAt: string },
  error: unknown,
  partialSummary?: Partial<ImportSummaryCounts>
) {
  const message = error instanceof Error ? error.message : String(error);
  const summary: ImportSummaryCounts = {
    fetchedCount: partialSummary?.fetchedCount || 0,
    insertedCount: partialSummary?.insertedCount || 0,
    updatedCount: partialSummary?.updatedCount || 0,
    skippedCount: partialSummary?.skippedCount || 0,
    errors: [...(partialSummary?.errors || []), message]
  };
  const supabase = createSupabaseAdminClient();
  const finishedAt = new Date();
  const startedAtMs = new Date(run.startedAt).getTime();
  const durationMs = Number.isFinite(startedAtMs) ? Math.max(0, finishedAt.getTime() - startedAtMs) : null;

  const { error: updateError } = await supabase
    .from("source_import_runs")
    .update({
      status: "failed",
      success: false,
      finished_at: finishedAt.toISOString(),
      duration_ms: durationMs,
      fetched_count: summary.fetchedCount,
      inserted_count: summary.insertedCount,
      updated_count: summary.updatedCount,
      skipped_count: summary.skippedCount,
      error_count: summary.errors.length,
      error_message: message,
      errors: summary.errors,
      summary
    })
    .eq("id", run.id);

  if (updateError) {
    throw new Error(`Unable to mark import run failed: ${updateError.message}`);
  }
}

export async function runWithImportHistory<TSummary extends ImportSummaryCounts>(
  options: ImportRunOptions | undefined,
  callback: () => Promise<TSummary>
) {
  if (!options) {
    return callback();
  }

  const run = await startImportRun(options);

  try {
    const summary = await callback();
    await finishImportRun(run, summary);
    return summary;
  } catch (error) {
    await failImportRun(run, error);
    throw error;
  }
}
