import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Mail, Phone, RefreshCw, Info } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "../api";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  GESTIONNAIRE: "Gestionnaire",
  VENDEUR: "Vendeur",
};

/**
 * ProfilePage (P6.1) — identity card from the live session user.
 *
 * swagger v1.0 pins NO profile-update and NO change-password endpoints
 * (`UtilisateurUpdateDTO` is admin-only via /utilisateurs/{id}, handled by
 * the Users feature), so this page is read-only by design: it renders the
 * user from the store, refreshed from /auth/me via the bootstrap query.
 * Edit/password forms land here when the backend exposes them.
 */
export const ProfilePage = () => {
  const { t } = useTranslation("auth");
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const refreshProfile = async () => {
    const fresh = await authApi.me();
    if (fresh) {
      useAuthStore.getState().setUser(fresh);
    }
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-content">
        {t("profileTitle", { defaultValue: "Mon profil" })}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("profileInfo", { defaultValue: "Informations personnelles" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar
              name={fullName || "Utilisateur"}
              size="md"
              className="h-20 w-20 !text-2xl"
            />
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-content">
                {fullName || "Utilisateur"}
              </h2>
              <p className="truncate text-content-secondary">{user?.login}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(user?.roles ?? []).map((role) => (
                  <Badge
                    key={role}
                    variant={
                      role === "ADMIN"
                        ? "gold"
                        : role === "GESTIONNAIRE"
                          ? "info"
                          : "secondary"
                    }
                  >
                    {ROLE_LABELS[role] ?? role}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              className="ml-auto"
              onClick={refreshProfile}
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-border pt-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-content-muted" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm text-content-secondary">
                  {t("email", { defaultValue: "Email" })}
                </p>
                <p className="truncate font-medium text-content">
                  {user?.email || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone
                className="h-5 w-5 text-content-muted"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm text-content-secondary">
                  {t("phone", { defaultValue: "Téléphone" })}
                </p>
                <p className="font-medium text-content">{user?.phone || "—"}</p>
              </div>
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-sm border border-border bg-surface-secondary px-3 py-2.5 text-xs text-content-muted dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-surface-secondary)]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t("profileReadOnly", {
              defaultValue:
                "La modification du profil et du mot de passe sera disponible lorsque l’API l’exposera (v1.0 : admin uniquement via la gestion des utilisateurs).",
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
