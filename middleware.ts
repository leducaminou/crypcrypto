// middleware.ts
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Roles } from "./app/lib/auth.config";

// Liste des routes publiques
const publicPaths = [
  "/",
  "/login", 
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/unauthorized",
];

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth.token;

    // Normaliser le pathname pour ignorer les paramètres de requête
    const basePath = pathname.split("?")[0];

    // Autoriser les fichiers statiques et les APIs
    if (
      basePath.startsWith("/_next/") ||
      basePath.startsWith("/images/") ||
      basePath.startsWith("/favicon.ico") ||
      basePath.startsWith("/api/auth/") ||
      basePath === "/api/auth"
    ) {
      return NextResponse.next();
    }

    // Vérifier si le chemin est public
    const isPublicPath = publicPaths.some(path => 
      basePath === path || basePath.startsWith(path + "/")
    );

    if (isPublicPath) {
      // Si l'utilisateur est déjà connecté et accède à une page d'auth, rediriger
      if (token && (basePath.startsWith("/login") || basePath.startsWith("/register"))) {
        const targetPath = token.role === Roles.ADMIN ? "/admin" : "/dashboard";
        return NextResponse.redirect(new URL(targetPath, request.url));
      }
      return NextResponse.next();
    }

    // Vérifier si l'utilisateur est connecté pour les routes protégées
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Règles de restriction par rôle
    if (basePath.startsWith("/admin") && token.role !== Roles.ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (basePath.startsWith("/dashboard") && token.role !== Roles.USER) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const basePath = pathname.split("?")[0];

        // Autoriser les fichiers statiques et APIs
        if (
          basePath.startsWith("/_next/") ||
          basePath.startsWith("/images/") ||
          basePath.startsWith("/favicon.ico") ||
          basePath.startsWith("/api/auth/") ||
          basePath === "/api/auth"
        ) {
          return true;
        }

        // Vérifier si le chemin est public
        const isPublicPath = publicPaths.some(path => 
          basePath === path || basePath.startsWith(path + "/")
        );

        if (isPublicPath) {
          return true;
        }

        // Exiger un token pour les routes protégées
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
      error: "/unauthorized",
    },
  }
);

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};