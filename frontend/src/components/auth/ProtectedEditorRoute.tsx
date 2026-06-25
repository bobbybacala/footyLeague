import { Navigate } from "react-router-dom";
import { useAppRole } from "@/context/AppRoleContext";

export function ProtectedEditorRoute({ children }: { children: React.ReactNode }) {
  const { canEdit, isReady } = useAppRole();

  if (!isReady) {
    return null;
  }

  if (!canEdit) {
    return <Navigate to="/" replace />;
  }

  return children;
}
