import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  DataTable,
  DataTableToolbar,
  createDataTableColumns,
  BadgeCell,
} from "@/components/data-table";
import type { UserRecord } from "../types";
import type { UserRole } from "@/features/auth/types";
import type { UserCreateFormData, UserEditFormData } from "../schemas";
import { UserCreateSchema, UserEditSchema } from "../schemas";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "../hooks";
import { FormDialog } from "@/components/forms/FormDialog";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { FormField, SelectField } from "@/components/forms/FormFields";
import { Button } from "@/components/ui/Button";
import { hasRole } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth.store";
import { Pencil, Plus, Trash2 } from "lucide-react";

/** Role → badge color (ADMIN gold, GESTIONNAIRE info, VENDEUR secondary). */
const ROLE_VARIANT = {
  SUPER_ADMIN: "danger",
  ADMIN: "gold",
  GESTIONNAIRE: "info",
  VENDEUR: "secondary",
} as const;

/**
 * Roles a company ADMIN may assign. SUPER_ADMIN is a platform-level account
 * created outside any tenant, so it is never offered here — and if one ever
 * surfaced in this list, editing it falls back to ADMIN rather than silently
 * sending an unassignable role.
 */
type AssignableRole = Exclude<UserRole, "SUPER_ADMIN">;

const assignableRole = (role: UserRole): AssignableRole =>
  role === "SUPER_ADMIN" ? "ADMIN" : role;

type DialogMode =
  { kind: "create" } | { kind: "edit"; user: UserRecord } | null;

/**
 * UsersPage (P3.3) — the pilot pattern on «utilisateurs», ADMIN-only.
 *
 * Swagger notes baked into this page:
 *  - creation goes through the admin-only POST /auth/register (login + password)
 *  - PUT /utilisateurs/{id} cannot change login or password → read-only login in edit
 *  - no `active` flag exists → deletion is a hard delete; self-deletion is blocked client-side
 */
export const UsersPage = () => {
  const { t } = useTranslation("users");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [deleting, setDeleting] = useState<UserRecord | null>(null);

  // Deep-link defense: re-check on every render (store is reactive).
  const isAdmin = hasRole("ADMIN");

  const listQuery = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const currentUserId = useAuthStore((s) => s.user?.id);

  const roleOptions = useMemo(
    () =>
      (["ADMIN", "GESTIONNAIRE", "VENDEUR"] as const).map((role) => ({
        value: role,
        label: t(`role.${role}`),
      })),
    [t],
  );

  const columns = useMemo(() => {
    const helper = createDataTableColumns<UserRecord>();
    return [
      helper.accessor("lastName", {
        header: t("fields.lastName"),
      }),
      helper.accessor("firstName", {
        header: t("fields.firstName"),
      }),
      helper.accessor("login", {
        header: t("fields.login"),
        cell: (info) => (
          <span className="font-mono text-sm">{info.getValue()}</span>
        ),
      }),
      helper.accessor("email", {
        header: t("fields.email"),
        cell: (info) =>
          info.getValue() ? (
            <a
              href={`mailto:${info.getValue()}`}
              onClick={(event) => event.stopPropagation()}
              className="text-primary hover:underline"
            >
              {info.getValue()}
            </a>
          ) : (
            "—"
          ),
      }),
      helper.accessor("role", {
        header: t("fields.role"),
        cell: (info) => (
          <BadgeCell
            label={t(`role.${info.getValue()}`)}
            variant={ROLE_VARIANT[info.getValue()]}
          />
        ),
      }),
      ...(isAdmin
        ? [
            helper.display({
              id: "actions",
              header: t("actions"),
              cell: (info) => {
                const user = info.row.original;
                const isSelf = user.id === currentUserId;
                return (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="edit"
                      size="icon"
                      aria-label={t("editTitle")}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDialogMode({ kind: "edit", user });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="group"
                      aria-label={isSelf ? t("selfDelete") : t("confirmDelete")}
                      disabled={isSelf}
                      title={isSelf ? t("selfDelete") : undefined}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleting(user);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-content-secondary transition-colors group-hover:text-danger-600 dark:group-hover:text-danger-500" />
                    </Button>
                  </div>
                );
              },
            }),
          ]
        : []),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, isAdmin, currentUserId]);

  const handleCreate = async (values: UserCreateFormData) => {
    await createUser.mutateAsync({
      login: values.login,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || undefined,
      phone: values.phone || undefined,
      role: values.role,
    });
  };

  const handleEdit = async (values: UserEditFormData) => {
    if (dialogMode?.kind !== "edit") return;
    await updateUser.mutateAsync({
      id: dialogMode.user.id,
      data: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        role: values.role,
      },
    });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteUser.mutateAsync(deleting.id);
    setDeleting(null);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-medium text-content">{t("adminOnly")}</h2>
        <p className="mt-1 text-sm text-content-muted">{t("adminOnlyHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("search")}
        actions={
          <Button
            variant="gold"
            onClick={() => setDialogMode({ kind: "create" })}
          >
            <Plus className="h-4 w-4" />
            {t("createTitle")}
          </Button>
        }
      />

      <DataTable<UserRecord>
        data={listQuery.data ?? []}
        columns={columns}
        isLoading={listQuery.isLoading}
        globalFilter={search}
        onRowClick={(user) => navigate(`/users/${user.id}`)}
      />

      {/* Create dialog — register contract: login + password required */}
      <FormDialog<UserCreateFormData>
        open={dialogMode?.kind === "create"}
        onClose={() => setDialogMode(null)}
        title={t("createTitle")}
        schema={UserCreateSchema}
        defaultValues={{
          login: "",
          password: "",
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: "VENDEUR",
        }}
        onSubmit={handleCreate}
      >
        {({ control }) => (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                name="firstName"
                control={control}
                label={t("fields.firstName")}
                required
              />
              <FormField
                name="lastName"
                control={control}
                label={t("fields.lastName")}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                name="login"
                control={control}
                label={t("fields.login")}
                required
              />
              <FormField
                name="password"
                control={control}
                label={t("fields.password")}
                type="password"
                required
                helperText={t("fields.passwordHint")}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                name="email"
                control={control}
                label={t("fields.email")}
                type="email"
              />
              <FormField
                name="phone"
                control={control}
                label={t("fields.phone")}
                type="tel"
              />
            </div>
            <SelectField
              name="role"
              control={control}
              label={t("fields.role")}
              options={roleOptions}
              required
            />
          </>
        )}
      </FormDialog>

      {/* Edit dialog — UtilisateurUpdateDTO: login/password immutable */}
      {dialogMode?.kind === "edit" && (
        <FormDialog<UserEditFormData>
          open
          onClose={() => setDialogMode(null)}
          title={t("editTitle")}
          schema={UserEditSchema}
          defaultValues={{
            firstName: dialogMode.user.firstName,
            lastName: dialogMode.user.lastName,
            email: dialogMode.user.email ?? "",
            phone: dialogMode.user.phone ?? "",
            role: assignableRole(dialogMode.user.role),
          }}
          onSubmit={handleEdit}
        >
          {({ control }) => (
            <>
              <div className="mb-4 rounded-sm border border-border-strong bg-surface px-3 py-2 text-sm text-content-muted dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-input)]">
                {t("fields.login")}&nbsp;:{" "}
                <span className="font-mono">{dialogMode.user.login}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  name="firstName"
                  control={control}
                  label={t("fields.firstName")}
                  required
                />
                <FormField
                  name="lastName"
                  control={control}
                  label={t("fields.lastName")}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  name="email"
                  control={control}
                  label={t("fields.email")}
                  type="email"
                />
                <FormField
                  name="phone"
                  control={control}
                  label={t("fields.phone")}
                  type="tel"
                />
              </div>
              <SelectField
                name="role"
                control={control}
                label={t("fields.role")}
                options={roleOptions}
                required
              />
            </>
          )}
        </FormDialog>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        entityName={
          deleting ? `${deleting.firstName} ${deleting.lastName}` : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  );
};
