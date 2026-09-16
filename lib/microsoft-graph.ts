const AUTHORITY = (tenantId: string) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0`;
const SCOPES = ["Mail.Read", "Mail.ReadWrite", "offline_access", "User.Read", "openid", "profile"];

export function buildAuthorizeUrl(params: {
  tenantId: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL(`${AUTHORITY(params.tenantId)}/authorize`);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

export async function exchangeCodeForTokens(params: {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
    scope: SCOPES.join(" "),
  });

  const res = await fetch(`${AUTHORITY(params.tenantId)}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Microsoft token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(params: {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    scope: SCOPES.join(" "),
  });

  const res = await fetch(`${AUTHORITY(params.tenantId)}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Microsoft token refresh failed: ${await res.text()}`);
  return res.json();
}

export async function getGraphProfile(accessToken: string): Promise<{ mail: string | null; userPrincipalName: string }> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Microsoft Graph /me failed: ${await res.text()}`);
  return res.json();
}

export type GraphMessage = {
  id: string;
  conversationId: string;
  subject: string | null;
  bodyPreview: string | null;
  body: { content: string; contentType: string } | null;
  from: { emailAddress: { address: string } } | null;
  toRecipients: Array<{ emailAddress: { address: string } }>;
  receivedDateTime: string;
  hasAttachments: boolean;
};

export async function listRecentMessages(accessToken: string, top = 50): Promise<GraphMessage[]> {
  const url =
    `https://graph.microsoft.com/v1.0/me/messages` +
    `?$top=${top}&$orderby=receivedDateTime desc` +
    `&$select=id,conversationId,subject,bodyPreview,body,from,toRecipients,receivedDateTime,hasAttachments`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Microsoft Graph /messages failed: ${await res.text()}`);
  const json = await res.json();
  return json.value ?? [];
}
