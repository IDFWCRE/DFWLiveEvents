import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "buyer" | "reseller" | "admin";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  reseller_status: "none" | "pending" | "approved" | "rejected" | "suspended";
};

export type SellerProfile = {
  id: string;
  user_id: string;
  business_name: string | null;
  display_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  verification_status: "not_started" | "pending" | "approved" | "rejected";
  terms_accepted_at: string | null;
};

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredAdminEmail(email?: string | null) {
  return Boolean(email && adminEmails().includes(email.toLowerCase()));
}

export async function ensureConfiguredAdminProfile(userId: string, email?: string | null) {
  if (!isConfiguredAdminEmail(email)) return;
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("user_profiles")
    .upsert(
      {
        id: userId,
        email: email || null,
        role: "admin"
      },
      { onConflict: "id" }
    );
}

export async function getCurrentUserWithProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null as UserProfile | null, sellerProfile: null as SellerProfile | null };
  }

  await ensureConfiguredAdminProfile(user.id, user.email);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, email, full_name, phone, role, reseller_status")
    .eq("id", user.id)
    .maybeSingle();

  const { data: sellerProfile } = await supabase
    .from("seller_profiles")
    .select("id, user_id, business_name, display_name, contact_email, contact_phone, website_url, verification_status, terms_accepted_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user,
    profile: (profile as UserProfile | null) || null,
    sellerProfile: (sellerProfile as SellerProfile | null) || null
  };
}

export async function currentUserIsAdmin() {
  const { user, profile } = await getCurrentUserWithProfile();
  return Boolean(user && (profile?.role === "admin" || isConfiguredAdminEmail(user.email)));
}

export async function requireAdminUser() {
  const { user, profile } = await getCurrentUserWithProfile();

  if (!user) {
    return { user: null, profile: null, isAdmin: false, reason: "not_authenticated" as const };
  }

  if (isConfiguredAdminEmail(user.email)) {
    await ensureConfiguredAdminProfile(user.id, user.email);
    return {
      user,
      profile: profile ? { ...profile, role: "admin" as const } : null,
      isAdmin: true,
      reason: null
    };
  }

  if (profile?.role === "admin") {
    return { user, profile, isAdmin: true, reason: null };
  }

  return { user, profile, isAdmin: false, reason: "not_admin" as const };
}
