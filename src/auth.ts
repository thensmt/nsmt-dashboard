import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_DOMAIN = "nsmtsports.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: { hd: ALLOWED_DOMAIN, prompt: "select_account" },
      },
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email;
      const verified = (profile as { email_verified?: boolean } | undefined)
        ?.email_verified;
      if (!email || !verified) return false;
      return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
    },
    authorized: async ({ auth }) => !!auth,
  },
});
