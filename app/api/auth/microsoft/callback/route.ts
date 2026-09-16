import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getGraphProfile } from "@/lib/microsoft-graph";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ms_oauth_state")?.value;
  const codeVerifier = cookieStore.get("ms_oauth_verifier")?.value;
  const entitySlug = cookieStore.get("ms_oauth_entity")?.value;

  cookieStore.delete("ms_oauth_state");
  cookieStore.delete("ms_oauth_verifier");
  cookieStore.delete("ms_oauth_entity");

  if (!entitySlug) return NextResponse.redirect(`${origin}/login`);
  const settingsUrl = `${origin}/${entitySlug}/settings/email`;

  if (oauthError) {
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state || state !== expectedState || !codeVerifier) {
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent("Invalid OAuth state")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, MICROSOFT_REDIRECT_URI } = process.env;
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_TENANT_ID || !MICROSOFT_REDIRECT_URI) {
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent("Microsoft OAuth is not configured")}`);
  }

  try {
    const tokens = await exchangeCodeForTokens({
      tenantId: MICROSOFT_TENANT_ID,
      clientId: MICROSOFT_CLIENT_ID,
      clientSecret: MICROSOFT_CLIENT_SECRET,
      redirectUri: MICROSOFT_REDIRECT_URI,
      code,
      codeVerifier,
    });

    const profile = await getGraphProfile(tokens.access_token);
    const emailAddress = profile.mail ?? profile.userPrincipalName;

    const service = createServiceRoleClient();
    const { data: entity } = await service.from("entities").select("id").eq("slug", entitySlug).single();
    if (!entity) throw new Error(`Entity not found for slug ${entitySlug}`);

    const { data: accessSecretId } = await service.rpc("vault_create_secret", {
      secret: tokens.access_token,
      secret_name: `ms_access_${entity.id}_${emailAddress}`,
    });
    const { data: refreshSecretId } = await service.rpc("vault_create_secret", {
      secret: tokens.refresh_token,
      secret_name: `ms_refresh_${entity.id}_${emailAddress}`,
    });

    await service.from("email_connections").upsert(
      {
        entity_id: entity.id,
        user_id: user.id,
        email_address: emailAddress,
        provider: "microsoft",
        access_token_secret_id: accessSecretId,
        refresh_token_secret_id: refreshSecretId,
        sync_status: "pending",
      },
      { onConflict: "entity_id,email_address" },
    );

    await service.from("activity_log").insert({
      entity_id: entity.id,
      user_id: user.id,
      action: "email_connection_added",
      target_table: "email_connections",
      after_value: { email_address: emailAddress, provider: "microsoft" },
    });

    return NextResponse.redirect(`${settingsUrl}?connected=${encodeURIComponent(emailAddress)}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent(message)}`);
  }
}
