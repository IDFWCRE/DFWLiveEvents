import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
      "id, source_name, run_type, status, import_window_start, import_window_end, started_at, finished_at, fetched_count, inserted_count, updated_count, skipped_count, error_count, error_message, summary, triggered_by, created_at"
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

  return NextResponse.json({ runs: data || [] });
}
