import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { buildAuthorizeUrl } from "@/lib/microsoft-graph";
import { generateCodeVerifier, codeChallengeFromVerifier } from "@/lib/pkce";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const entitySlug = searchParams.get("entitySlug");
  if (!entitySlug) return NextResponse.json({ error: "entitySlug is required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const { MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, MICROSOFT_REDIRECT_URI } = process.env;
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_TENANT_ID || !MICROSOFT_REDIRECT_URI) {
    return NextResponse.json(
      { error: "Microsoft OAuth isn't configured yet (MICROSOFT_CLIENT_ID/TENANT_ID/REDIRECT_URI missing)." },
      { status: 500 },
    );
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = codeChallengeFromVerifier(codeVerifier);
  const state = randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  cookieStore.set("ms_oauth_verifier", codeVerifier, cookieOpts);
  cookieStore.set("ms_oauth_state", state, cookieOpts);
  cookieStore.set("ms_oauth_entity", entitySlug, cookieOpts);

  const authorizeUrl = buildAuthorizeUrl({
    tenantId: MICROSOFT_TENANT_ID,
    clientId: MICROSOFT_CLIENT_ID,
    redirectUri: MICROSOFT_REDIRECT_URI,
    state,
    codeChallenge,
  });

  return NextResponse.redirect(authorizeUrl);
}
