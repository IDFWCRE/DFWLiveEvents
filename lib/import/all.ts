import { importEventbriteEvents, type EventbriteImportSummary } from "@/lib/eventbrite/importer";
import { importTicketmasterEvents, type TicketmasterImportSummary } from "@/lib/ticketmaster/importer";
import { runWithImportHistory, type ImportRunType, type ImportSummaryCounts } from "@/lib/import/runs";

type CombinedImportOptions = {
  log?: (message: string) => void;
  runType?: ImportRunType;
  triggeredBy?: string;
};

function emptySummary(message: string): ImportSummaryCounts {
  return {
    fetchedCount: 0,
    insertedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errors: [message]
  };
}

export type CombinedImportSummary = {
  ticketmaster: TicketmasterImportSummary | ImportSummaryCounts;
  eventbrite: EventbriteImportSummary | ImportSummaryCounts;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalSkipped: number;
  errors: string[];
};

async function runCombinedImport(options: CombinedImportOptions = {}): Promise<CombinedImportSummary> {
  const ticketmaster = await importTicketmasterEvents({
    log: options.log,
    runType: options.runType,
    triggeredBy: options.triggeredBy
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    options.log?.(`[import:all] Ticketmaster failed: ${message}`);
    return emptySummary(`Ticketmaster: ${message}`);
  });

  const eventbrite = await importEventbriteEvents({
    log: options.log,
    runType: options.runType,
    triggeredBy: options.triggeredBy
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    options.log?.(`[import:all] Eventbrite failed: ${message}`);
    return emptySummary(`Eventbrite: ${message}`);
  });

  const errors = [...ticketmaster.errors, ...eventbrite.errors];

  return {
    ticketmaster,
    eventbrite,
    totalFetched: ticketmaster.fetchedCount + eventbrite.fetchedCount,
    totalInserted: ticketmaster.insertedCount + eventbrite.insertedCount,
    totalUpdated: ticketmaster.updatedCount + eventbrite.updatedCount,
    totalSkipped: ticketmaster.skippedCount + eventbrite.skippedCount,
    errors
  };
}

export async function importAllSources(options: CombinedImportOptions = {}) {
  return runWithImportHistory(
    options.runType
      ? {
          sourceName: "all",
          runType: options.runType,
          triggeredBy: options.triggeredBy
        }
      : undefined,
    async () => {
      const summary = await runCombinedImport(options);
      return {
        ...summary,
        fetchedCount: summary.totalFetched,
        insertedCount: summary.totalInserted,
        updatedCount: summary.totalUpdated,
        skippedCount: summary.totalSkipped,
        errors: summary.errors
      };
    }
  );
}
