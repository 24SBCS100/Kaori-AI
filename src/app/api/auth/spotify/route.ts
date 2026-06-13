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

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Spotify OAuth is not configured." }, { status: 500 });
  }

  const scope = "user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private";
  
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("scope", scope);
  const oauthState = createOAuthState("spotify", user.id);
  authUrl.searchParams.append("state", oauthState.state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set(getOAuthStateCookieName("spotify"), oauthState.cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
