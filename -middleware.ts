import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Définir les rôles possibles
enum Roles {
  ADMIN = "ADMIN",
  USER = "USER",
}

// Liste des routes publiques accessibles à tous
const publicPaths = [
  "/register",
  "/login",
  "/forgot-password",
  "/verification",
];

// Routes interdites aux utilisateurs connectés
const restrictedWhenAuthenticated = [
   "/register",
  "/login",
  "/forgot-password",
  "/verification",
];

// Routes accessibles à tous les utilisateurs connectés
const unrestrictedPaths = ["/", "/aide"];

// Association des rôles aux préfixes de routes
const roleRoutePrefixes: Record<Roles, string> = {
  [Roles.ADMIN]: "/admin",
  [Roles.USER]: "/dashboard",
};

export default withAuth(
  async function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    const { token } = request.nextauth;

    console.log(`Middleware - Chemin demandé : ${pathname}, Token : ${token ? "Présent" : "Absent"}`);

    // Ignorer les requêtes non pertinentes
    if (pathname.startsWith("/.well-known")) {
      console.log("Ignorer la requête non pertinente:", pathname);
      return NextResponse.next();
    }

    // Autoriser les fichiers statiques
    if (
      pathname.startsWith("/public/") ||
      /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf)$/.test(pathname)
    ) {
      console.log("Autorisation de fichier statique:", pathname);
      return NextResponse.next();
    }

    // Vérifier si le chemin est public
    const isPublicPath = publicPaths.includes(pathname);
    if (isPublicPath) {
      if (token && restrictedWhenAuthenticated.includes(pathname)) {
        console.log("Utilisateur connecté redirigé de la route publique restreinte:", pathname);
        return NextResponse.redirect(new URL("/", request.url));
      }
      console.log("Accès autorisé à la route publique:", pathname);
      return NextResponse.next();
    }

    // Vérifier si l’utilisateur est connecté
    if (!token) {
      console.log("Utilisateur non connecté, redirection vers /");
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Vérifier les routes unrestricted
    const isUnrestrictedPath = unrestrictedPaths.some((path) => pathname.startsWith(path));
    if (isUnrestrictedPath) {
      console.log("Accès autorisé à une route non restreinte:", pathname);
      return NextResponse.next();
    }

    // Vérifier le rôle
    const userRole = token.role as Roles | undefined;
    if (!userRole) {
      console.warn("Rôle utilisateur non défini, redirection vers /");
      return NextResponse.redirect(new URL("/", request.url));
    }

    const allowedPrefix = roleRoutePrefixes[userRole];
    if (!allowedPrefix) {
      console.warn("Aucun préfixe défini pour le rôle:", userRole);
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!pathname.startsWith(allowedPrefix)) {
      console.log(
        `Accès non autorisé - Préfixe requis: ${allowedPrefix} pour le rôle ${userRole}, chemin demandé: ${pathname}`
      );
      return NextResponse.redirect(new URL("/", request.url));
    }

    console.log("Accès autorisé pour le chemin:", pathname);
    return NextResponse.next();
  },
  {
    callbacks: {
      async authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        if (
          pathname.startsWith("/public/") ||
          pathname.startsWith("/.well-known") ||
          /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf)$/.test(pathname)
        ) {
          console.log("Autorisation automatique pour le chemin statique:", pathname);
          return true;
        }

        if (publicPaths.includes(pathname)) {
          console.log("Autorisation de chemin public:", pathname);
          return true;
        }

        const isAuthorized = !!token;
        console.log(`Autorisation: ${isAuthorized ? "Oui" : "Non"} pour le chemin ${pathname}`);
        return isAuthorized;
      },
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: ["/((?!api/|_next/|public/|favicon.ico).*)"],
};