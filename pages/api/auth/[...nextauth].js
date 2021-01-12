import NextAuth from "next-auth";
import Providers from "next-auth/providers";
import querystring from "querystring";

const options = {
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizationUrl:
        "https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&response_type=code",
    }),
  ],
  callbacks: {
    async jwt(prevToken, account, profile) {
      console.log(prevToken);
      // Signing in
      if (account && profile) {
        return {
          accessToken: account.accessToken,
          accessTokenExpires: account.accessTokenExpires,
          refreshToken: account.refreshToken,
          user: profile,
        };
      }

      // Subsequent use of JWT, the user has been logged in before
      // access token has not expired yet
      if (Date.now() < prevToken.accessTokenExpires) {
        return prevToken;
      }
      // access token has expired, try to update it
      return refreshAccessToken(prevToken);
    },
    async session(_, token) {
      return token;
    },
  },
};

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      querystring.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.user.refreshToken,
      });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshToken = await response.json();

    if (!response.ok) {
      throw refreshToken;
    }

    // Give a 10 sec buffer
    const now = new Date();
    const accessTokenExpires = now.setSeconds(
      now.getSeconds() + refreshToken.expires_in - 10
    );

    return {
      ...token,
      accessToken: refreshToken.access_token,
      accessTokenExpires,
      refreshToken: refreshToken.refresh_token,
    };
  } catch (error) {
    console.log(error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}
export default (req, res) => NextAuth(req, res, options);
