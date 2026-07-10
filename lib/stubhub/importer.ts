import { getActiveSourceImportTargets, type SourceImportTarget } from "@/lib/import/source-targets";
import { ingestNormalizedProviderEvents } from "@/lib/import/providers";
import { getImportWindow, isDateInImportWindow } from "@/lib/import/window";
import { runWithImportHistory, type ImportRunType } from "@/lib/import/runs";
import { fetchStubHubEvents } from "./client";
import { normalizeStubHubEvent, type NormalizedStubHubEvent } from "./normalize";

export type StubHubImportSummary = {
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
  disabled?: boolean;
};

export type StubHubImportOptions = {
  log?: (message: string) => void;
  runType?: ImportRunType;
  triggeredBy?: string;
};

function dedupeNormalizedEvents(events: NormalizedStubHubEvent[]) {
  return [...new Map(events.map((event) => [event.externalEventId, event])).values()];
}

async function importStubHubEventsInternal(options: StubHubImportOptions = {}): Promise<StubHubImportSummary> {
  options.log?.("[stubhub] Import started");
  const importWindow = getImportWindow();
  let targets: SourceImportTarget[] = [];

  try {
    targets = await getActiveSourceImportTargets("stubhub");
    options.log?.(`[stubhub] Loaded ${targets.length} active source_import_targets row(s)`);
  } catch (error) {
    options.log?.(`[stubhub] Could not load source_import_targets: ${error instanceof Error ? error.message : String(error)}`);
  }

  const fetched = await fetchStubHubEvents({ log: options.log, targets });
  if (fetched.disabled) {
    return { fetchedCount: 0, insertedCount: 0, updatedCount: 0, skippedCount: 0, errors: [], disabled: true };
  }

  const normalizedResults = fetched.events.map(normalizeStubHubEvent);
  const normalizedEvents = dedupeNormalizedEvents(
    normalizedResults
      .filter((result) => {
        if (result.skipped) {
          options.log?.(`[stubhub] Skipped: ${result.reason}`);
          return false;
        }
        if (!isDateInImportWindow(`${result.event.eventDate}T${result.event.eventTime || "00:00:00"}`, importWindow)) {
          options.log?.(`[stubhub] Skipped outside import window: ${result.event.title}`);
          return false;
        }
        return true;
      })
      .map((result) => result.event)
      .filter((event): event is NormalizedStubHubEvent => Boolean(event))
  );
  const skippedCount = fetched.skippedCount + normalizedResults.filter((result) => result.skipped).length + (normalizedResults.length - normalizedEvents.length);

  const summary = await ingestNormalizedProviderEvents("stubhub", normalizedEvents, {
    fetchedCount: fetched.fetchedCount,
    skippedCount,
    errors: fetched.errors,
    log: options.log
  });

  options.log?.(
    `[stubhub] Import complete: fetched=${summary.fetchedCount}, inserted=${summary.insertedCount}, updated=${summary.updatedCount}, skipped=${summary.skippedCount}, errors=${summary.errors.length}`
  );

  return summary;
}

export async function importStubHubEvents(options: StubHubImportOptions = {}): Promise<StubHubImportSummary> {
  return runWithImportHistory(
    options.runType
      ? {
          sourceName: "stubhub",
          runType: options.runType,
          triggeredBy: options.triggeredBy
        }
      : undefined,
    () => importStubHubEventsInternal(options)
  );
}
