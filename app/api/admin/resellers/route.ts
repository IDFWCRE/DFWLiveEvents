import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("seller_profiles")
    .select("id, user_id, business_name, display_name, contact_email, contact_phone, website_url, verification_status, terms_accepted_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data || [] });
}
