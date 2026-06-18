import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { validateSourceTargetPayload } from "@/lib/admin/source-targets";
import { getSourceImportTargets, sourceTargetSelect } from "@/lib/import/source-targets";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  try {
    return NextResponse.json({ targets: await getSourceImportTargets() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  const payload = (await request.json().catch(() => null)) || {};
  const validation = validateSourceTargetPayload(payload);
  if (!validation.data) {
    return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("source_import_targets")
    .upsert(validation.data, { onConflict: "source_name,target_type,target_value" })
    .select(sourceTargetSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ target: data });
}
