import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./lib/prisma";
import { isEmailIdentifier, normalizePhoneNumber } from "./lib/identity";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        identifier: {
          label: "Nomor HP atau Email",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        try {
          const rawIdentifier = String(credentials?.identifier ?? "").trim();
          const password = String(credentials?.password ?? "");

          if (!rawIdentifier || !password) {
            return null;
          }

          const user = await prisma.user.findFirst({
            where: isEmailIdentifier(rawIdentifier)
              ? {
                  email: rawIdentifier.toLowerCase(),
                }
              : {
                  phone: normalizePhoneNumber(rawIdentifier),
                },
          });

          if (!user) {
            console.log("[AUTH] user tidak ditemukan:", rawIdentifier);
            return null;
          }

          if (!user.passwordHash) {
            console.log("[AUTH] user tidak punya passwordHash:", rawIdentifier);
            return null;
          }

          if (!user.isActive) {
            console.log("[AUTH] user tidak aktif:", rawIdentifier);
            return null;
          }

          const isValidPassword = await compare(password, user.passwordHash);

          if (!isValidPassword) {
            console.log("[AUTH] password salah:", rawIdentifier);
            return null;
          }

          console.log("[AUTH] login sukses:", rawIdentifier);

          return {
            id: user.id,
            name: user.name,
            email: user.email ?? null,
            role: user.role,
          };
        } catch (error) {
          console.error("[AUTH][AUTHORIZE_ERROR]", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.role = (user as { role?: string }).role ?? "USER";
        }

        return token;
      } catch (error) {
        console.error("[AUTH][JWT_ERROR]", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = String(token.id ?? "");
          session.user.role = String(token.role ?? "USER");
        }

        return session;
      } catch (error) {
        console.error("[AUTH][SESSION_ERROR]", error);
        return session;
      }
    },
  },
});