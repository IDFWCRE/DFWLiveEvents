"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/auth/profiles";

function safeNext(value: FormDataEntryValue | string | null) {
  const next = String(value || "").trim();
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

function encodedMessage(message: string) {
  return encodeURIComponent(message);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodedMessage(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/adminlogin?error=${encodedMessage(error.message)}&next=${encodeURIComponent(next)}`);
  }

  const admin = await requireAdminUser();
  if (!admin.isAdmin) {
    await supabase.auth.signOut();
    redirect(`/adminlogin?error=${encodedMessage("This account does not have admin access.")}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const accountType = String(formData.get("account_type") || "buyer");
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        account_type: accountType
      }
    }
  });

  if (error) {
    redirect(`/register?error=${encodedMessage(error.message)}&next=${encodeURIComponent(next)}`);
  }

  if (!data.session) {
    redirect(`/login?message=${encodedMessage("Registration received. Check your email to confirm your account, then log in.")}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login?message=Logged%20out%20successfully.");
}

export async function resellerApplicationAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/reseller");
  }

  const termsAccepted = formData.get("terms") === "on";
  if (!termsAccepted) {
    redirect("/account/reseller?error=You%20must%20accept%20the%20seller%20terms.");
  }

  const admin = createSupabaseAdminClient();
  const sellerProfile = {
    user_id: user.id,
    business_name: String(formData.get("business_name") || "").trim() || null,
    display_name: String(formData.get("display_name") || "").trim() || null,
    contact_email: String(formData.get("contact_email") || user.email || "").trim() || null,
    contact_phone: String(formData.get("contact_phone") || "").trim() || null,
    website_url: String(formData.get("website_url") || "").trim() || null,
    verification_status: "pending",
    terms_accepted_at: new Date().toISOString()
  };

  await admin.from("seller_profiles").upsert(sellerProfile, { onConflict: "user_id" });
  await admin
    .from("user_profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        reseller_status: "pending"
      },
      { onConflict: "id" }
    );

  redirect("/account/reseller?message=Reseller%20application%20submitted.");
}
