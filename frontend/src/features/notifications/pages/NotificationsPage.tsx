import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  DataTableToolbar,
  createDataTableColumns,
  DataTable,
} from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/Card";
import { BellOff } from "lucide-react";
import type { AppNotification } from "../types";
import { useNotifications } from "../hooks";
import { NotificationTypeBadge } from "../components/NotificationTypeBadge";

/**
 * NotificationsPage (P6.3) — «notifications actives» as a clean list:
 * type badge, message, and a link to the article concerned when present.
 * No mark-as-read exists in swagger v1.0 — entries disappear when the
 * backend clears them (e.g. stock restocked), so the page simply reflects
 * the live server state (60s polling).
 */
export const NotificationsPage = () => {
  const { t } = useTranslation("notifications");

  const [search, setSearch] = useState("");

  const listQuery = useNotifications();
  const rows = listQuery.data ?? [];

  const columns = useMemo(() => {
    const helper = createDataTableColumns<AppNotification>();
    return [
      helper.accessor("type", {
        header: t("fields.type"),
        cell: (info) => <NotificationTypeBadge type={info.getValue()} />,
      }),
      helper.accessor("message", {
        header: t("fields.message"),
      }),
      helper.accessor("articleDesignation", {
        header: t("fields.article"),
        cell: (info) => {
          const notification = info.row.original;
          if (notification.articleId) {
            return (
              <Link
                to={`/catalog/articles/${notification.articleId}`}
                className="text-primary hover:underline"
              >
                {info.getValue() ?? `#${notification.articleId}`}
              </Link>
            );
          }
          return "—";
        },
      }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  if (!listQuery.isLoading && rows.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-content">{t("title")}</h1>
          <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <BellOff
              className="h-10 w-10 text-content-disabled"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-content">{t("empty")}</p>
            <p className="text-sm text-content-muted">{t("emptyHint")}</p>
          </CardContent>
        </Card>
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
      />

      <DataTable<AppNotification>
        data={rows}
        columns={columns}
        isLoading={listQuery.isLoading}
        globalFilter={search}
      />
    </div>
  );
};
