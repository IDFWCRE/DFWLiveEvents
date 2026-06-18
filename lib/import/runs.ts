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
      run_type: options.runType,
      status: "running",
      import_window_start: importWindow.startIso,
      import_window_end: importWindow.endIso,
      triggered_by: options.triggeredBy || null
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Unable to create import run record: ${error.message}`);
  }

  return String(data.id);
}

export async function finishImportRun(runId: string, summary: ImportSummaryCounts) {
  const supabase = createSupabaseAdminClient();
  const status = getSummaryStatus(summary);
  const errorMessage = summary.errors.length ? summary.errors.slice(0, 5).join("\n") : null;

  const { error } = await supabase
    .from("source_import_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      fetched_count: summary.fetchedCount,
      inserted_count: summary.insertedCount,
      updated_count: summary.updatedCount,
      skipped_count: summary.skippedCount,
      error_count: summary.errors.length,
      error_message: errorMessage,
      summary
    })
    .eq("id", runId);

  if (error) {
    throw new Error(`Unable to update import run record: ${error.message}`);
  }

  return status;
}

export async function failImportRun(
  runId: string,
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

  const { error: updateError } = await supabase
    .from("source_import_runs")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      fetched_count: summary.fetchedCount,
      inserted_count: summary.insertedCount,
      updated_count: summary.updatedCount,
      skipped_count: summary.skippedCount,
      error_count: summary.errors.length,
      error_message: message,
      summary
    })
    .eq("id", runId);

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

  const runId = await startImportRun(options);

  try {
    const summary = await callback();
    await finishImportRun(runId, summary);
    return summary;
  } catch (error) {
    await failImportRun(runId, error);
    throw error;
  }
}
