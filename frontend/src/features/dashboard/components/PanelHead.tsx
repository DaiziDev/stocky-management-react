import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { langPath } from "@/lib/lang-path";

/** Mockup .card-head — Fraunces title + gold-hover "voir tout" link. */
export const PanelHead = ({
  title,
  to,
  linkLabel,
}: {
  title: string;
  to?: string;
  linkLabel?: string;
}) => {
  const { t } = useTranslation("common");
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="font-display text-[17px] font-semibold text-content">
        {title}
      </h3>
      {to && (
        <Link
          to={langPath(to)}
          className="flex items-center gap-1 text-[12.5px] font-semibold text-primary-700 transition-colors hover:text-accent-600"
        >
          {linkLabel ?? t("seeAll")}
          <ArrowRight className="h-[13px] w-[13px]" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
};
