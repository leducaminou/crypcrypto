// app/lib/auth.config.ts
import { NextAuthOptions, User, Account, Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import type { Adapter } from "next-auth/adapters";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

export enum Roles {
  ADMIN = "ADMIN",
  USER = "USER",
}

// Extension des types NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: Roles;
    isVerified: boolean;
    firstName?: string | null;
    lastName?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: Roles;
      isVerified: boolean;
      firstName?: string | null;
      lastName?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: Roles;
    isVerified: boolean;
    firstName?: string | null;
    lastName?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email ou Téléphone", type: "text" },
        password: { label: "Mot de passe", type: "password" },
        rememberMe: { label: "Se souvenir de moi", type: "checkbox" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Identifiant et mot de passe requis");
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier.toLowerCase() },
              { phone: credentials.identifier },
            ],
            is_active: true,
            is_locked: false,
          },
        });

        if (!user) {
          throw new Error("Utilisateur non trouvé");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error("Mot de passe incorrect");
        }

        // Mettre à jour la date de dernière connexion
        await prisma.user.update({
          where: { id: user.id },
          data: {
            last_login_at: new Date(),
          },
        });

          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role as Roles,
            isVerified: user.is_email_verified,
            firstName: user.first_name,
            lastName: user.last_name,
          };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }: { 
      token: JWT; 
      user?: User; 
      trigger?: string; 
      session?: any; 
    }) {
      // Au moment de la connexion
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.role = user.role;
          token.isVerified = user.isVerified;
          token.firstName = user.firstName;
          token.lastName = user.lastName;
        }

      // Mettre à jour le token si la session est mise à jour
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      return token;
    },
    
    async session({ session, token }: { 
      session: any; 
      token: JWT; 
    }) {
        if (session.user) {
          session.user.id = token.id;
          session.user.email = token.email;
          session.user.role = token.role;
          session.user.isVerified = token.isVerified;
          session.user.firstName = token.firstName;
          session.user.lastName = token.lastName;
        }
      return session;
    },
    
    async redirect({ url, baseUrl }: { 
      url: string; 
      baseUrl: string; 
    }) {
      // Permettre les redirections relatives
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Permettre les redirections vers le même domaine
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/unauthorized",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};