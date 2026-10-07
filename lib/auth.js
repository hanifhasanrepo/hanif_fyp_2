import CredentialsProvider from "next-auth/providers/credentials";

const DEMO_USER = {
  id: "1",
  name: "Hanif",
  username: "hanif",
  password: "12345",
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const isValid =
          credentials?.username === DEMO_USER.username &&
          credentials?.password === DEMO_USER.password;

        if (!isValid) return null;

        return {
          id: DEMO_USER.id,
          name: DEMO_USER.name,
          username: DEMO_USER.username,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async session({ session, token }) {
      session.user = {
        id: token.sub,
        name: token.name ?? null,
        username: token?.username ?? null,
      };
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "football-manager-secret",
};
