import { Roles } from "../auth.config";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export const useRoleGuard = (allowedRoles: Roles[]) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Memoïser le callback du guard pour éviter recréations et potentiels re-lancements inutiles
  const handleRoleCheck = useCallback(() => {
    if (status === "authenticated" && session?.user) {
      if (!allowedRoles.includes(session.user.role)) {
        router.push("/unauthorized");
      }
    }
  }, [status, session, allowedRoles, router]); // Inclut router pour complétude, bien qu'il soit stable

  useEffect(() => {
    
    handleRoleCheck();
  }, [handleRoleCheck]); // Dep stable : effect se lance seulement si handleRoleCheck change (rare)
};