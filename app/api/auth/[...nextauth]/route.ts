import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { getAdminFirestore } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";

const USERS_COLLECTION = "users";

const handler = NextAuth({
  adapter: FirestoreAdapter({
    firestore: getAdminFirestore(),
  }),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Passord", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const db = getAdminFirestore();
        const snapshot = await db
          .collection(USERS_COLLECTION)
          .where("email", "==", credentials.email.toLowerCase().trim())
          .limit(1)
          .get();
        const doc = snapshot.docs[0];
        if (!doc?.exists) return null;
        const data = doc.data();
        const passwordHash = data.passwordHash as string | undefined;
        if (!passwordHash) return null;
        const valid = await bcrypt.compare(
          credentials.password,
          passwordHash
        );
        if (!valid) return null;
        return {
          id: doc.id,
          email: data.email as string,
          name: (data.name as string) ?? null,
        };
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
