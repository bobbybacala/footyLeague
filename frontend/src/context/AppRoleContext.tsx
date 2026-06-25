import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/api/client";
import {
  clearPersistedAuth,
  persistAuth,
} from "@/lib/authStorage";
import type { AppRole } from "@/types";

interface AppRoleContextValue {
  role: AppRole | null;
  isReady: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canEdit: boolean;
  loginAsViewer: () => Promise<void>;
  loginAsEditor: (secretKey: string) => Promise<void>;
  clearRole: () => void;
}

const AppRoleContext = createContext<AppRoleContextValue | null>(null);

export function AppRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("footy_app_token");
    if (!token) {
      setIsReady(true);
      return;
    }

    authApi
      .session()
      .then(({ role: sessionRole }) => {
        if (sessionRole === "editor" || sessionRole === "viewer") {
          setRole(sessionRole);
          persistAuth(sessionRole, token);
        } else {
          clearPersistedAuth();
        }
      })
      .catch(() => {
        clearPersistedAuth();
      })
      .finally(() => setIsReady(true));
  }, []);

  const loginAsViewer = useCallback(async () => {
    const { role: viewerRole, token } = await authApi.loginViewer();
    persistAuth(viewerRole, token);
    setRole(viewerRole);
  }, []);

  const loginAsEditor = useCallback(async (secretKey: string) => {
    const { role: editorRole, token } = await authApi.loginEditor(secretKey);
    persistAuth(editorRole, token);
    setRole(editorRole);
  }, []);

  const clearRole = useCallback(() => {
    clearPersistedAuth();
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({
      role,
      isReady,
      isEditor: role === "editor",
      isViewer: role === "viewer",
      canEdit: role === "editor",
      loginAsViewer,
      loginAsEditor,
      clearRole,
    }),
    [role, isReady, loginAsViewer, loginAsEditor, clearRole]
  );

  return (
    <AppRoleContext.Provider value={value}>{children}</AppRoleContext.Provider>
  );
}

export function useAppRole() {
  const ctx = useContext(AppRoleContext);
  if (!ctx) {
    throw new Error("useAppRole must be used within AppRoleProvider");
  }
  return ctx;
}

export function useCanEdit() {
  return useAppRole().canEdit;
}
