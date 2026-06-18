import { NextResponse } from "next/server";
import { isAdminTokenOrRoleAuthorized, unauthorizedJson } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedActions = ["approve", "reject", "suspend"] as const;

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminTokenOrRoleAuthorized(request))) {
    return unauthorizedJson();
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) || {};
  const action = String(body.action || "");

  if (!allowedActions.includes(action as (typeof allowedActions)[number])) {
    return NextResponse.json({ error: "action must be approve, reject, or suspend." }, { status: 400 });
  }

  const verificationStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "rejected";
  const resellerStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "suspended";
  const role = action === "approve" ? "reseller" : "buyer";
  const supabase = createSupabaseAdminClient();

  const { data: sellerProfile, error: sellerError } = await supabase
    .from("seller_profiles")
    .update({ verification_status: verificationStatus })
    .eq("id", id)
    .select("id, user_id, business_name, display_name, contact_email, verification_status")
    .single();

  if (sellerError) {
    return NextResponse.json({ error: sellerError.message }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({ reseller_status: resellerStatus, role })
    .eq("id", sellerProfile.user_id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ application: sellerProfile, reseller_status: resellerStatus });
}
