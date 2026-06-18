import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SourceImportTarget = {
  id: string;
  source_name: string;
  target_type: "city" | "organization" | "venue" | "event" | string;
  target_value: string;
  label: string | null;
  city: string | null;
  category: string | null;
  active: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export const sourceTargetSelect =
  "id, source_name, target_type, target_value, label, city, category, active, notes, created_at, updated_at";

export async function getActiveSourceImportTargets(sourceName?: string) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("source_import_targets")
    .select(sourceTargetSelect)
    .eq("active", true)
    .order("source_name", { ascending: true })
    .order("target_type", { ascending: true });

  if (sourceName) {
    query = query.eq("source_name", sourceName);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Unable to read source import targets: ${error.message}`);
  }

  return (data || []) as SourceImportTarget[];
}

export async function getSourceImportTargets() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("source_import_targets")
    .select(sourceTargetSelect)
    .order("source_name", { ascending: true })
    .order("target_type", { ascending: true })
    .order("target_value", { ascending: true });

  if (error) {
    throw new Error(`Unable to read source import targets: ${error.message}`);
  }

  return (data || []) as SourceImportTarget[];
}
