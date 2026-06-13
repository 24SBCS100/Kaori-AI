import { NextResponse } from "next/server";
import {
  createOAuthState,
  getOAuthStateCookieName,
  getSessionUser,
} from "../../lib/auth-utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 500 });
  }

  const scope = "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email";
  
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", scope);
  authUrl.searchParams.append("access_type", "offline");
  authUrl.searchParams.append("prompt", "consent");
  const oauthState = createOAuthState("google", user.id);
  authUrl.searchParams.append("state", oauthState.state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set(getOAuthStateCookieName("google"), oauthState.cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
