import { createKindeServerClient } from "@kinde-oss/kinde-auth-nextjs";

export const kindeAuth = createKindeServerClient({
  clientId: process.env.KINDE_CLIENT_ID!,
  clientSecret: process.env.KINDE_CLIENT_SECRET!,
  issuerUrl: process.env.KINDE_ISSUER_URL!,
  siteUrl: process.env.KINDE_SITE_URL!,
  postLoginRedirectURL: process.env.KINDE_POST_LOGIN_REDIRECT_URL!,
  postLogoutRedirectURL: process.env.KINDE_POST_LOGOUT_REDIRECT_URL!,
});
