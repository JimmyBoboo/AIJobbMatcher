import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Brukernavn", type: "text" },
        password: { label: "Passord", type: "password" },
      },
      async authorize(credentials) {
        const username = process.env.AUTH_USERNAME ?? "demo";
        const password = process.env.AUTH_PASSWORD ?? "demo";
        if (
          credentials?.username === username &&
          credentials?.password === password
        ) {
          return {
            id: "1",
            name: credentials.username,
            email: `${credentials.username}@example.com`,
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
