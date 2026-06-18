import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { validateSourceTargetPayload } from "@/lib/admin/source-targets";
import { sourceTargetSelect } from "@/lib/import/source-targets";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  const { id } = await context.params;
  const payload = (await request.json().catch(() => null)) || {};
  const validation = validateSourceTargetPayload(payload, true);
  if (!validation.data) {
    return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("source_import_targets")
    .update(validation.data)
    .eq("id", id)
    .select(sourceTargetSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ target: data });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("source_import_targets").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
