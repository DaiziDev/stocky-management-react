import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Search, Loader2, SearchX } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useEntitySearch } from "@/features/search/hooks";
import { ENTITY_META, entityLabelKey } from "@/features/search/constants";
import { Highlight } from "@/components/ui/Highlight";
import { langPath } from "@/lib/lang-path";

const MAX_WIDTH = "sm:max-w-[420px]";
const MIN_QUERY_LENGTH = 2;
const PREVIEW_SIZE = 5;
const MAX_PER_GROUP = 3;

interface FlatItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  entity: keyof typeof ENTITY_META;
}

/**
 * Topbar global search with instant-results dropdown — mockup §15 `.tb-search`
 * pill (r-22, 1.5px border, surface-alt bg, leading icon). Typing ≥2 chars
 * queries all entities (size 5 each) and shows grouped previews; ↑/↓ + Enter
 * selects an item, Enter alone opens the full `/search?q=` page.
 */
export const GlobalSearch = () => {
  const { t } = useTranslation("common");
  // Entity labels are DATA keys (common:layout.entity*) — dynamic lookups cast.
  const tDynamic = t as unknown as (
    key: string,
    options?: Record<string, unknown>,
  ) => string;
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [lastQuery, setLastQuery] = useState("");
  const debouncedValue = useDebounce(value, 450);

  const query = value.trim();
  const debouncedQuery = debouncedValue.trim();
  const searchEnabled = query.length >= MIN_QUERY_LENGTH;
  // Only fetch while the dropdown is relevant; '' disables the hook.
  const activeQuery = focused && searchEnabled ? debouncedQuery : "";
  const { data, isPending } = useEntitySearch(activeQuery, PREVIEW_SIZE);

  const groups = useMemo(
    () =>
      (data?.groups ?? [])
        .map((group) => ({
          ...group,
          preview: group.items.slice(0, MAX_PER_GROUP),
        }))
        .filter((group) => group.preview.length > 0),
    [data],
  );

  const flatItems = useMemo<FlatItem[]>(
    () =>
      groups.flatMap((group) =>
        group.preview.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          href: item.href,
          entity: group.entity,
        })),
      ),
    [groups],
  );

  const showDropdown = open && focused && searchEnabled;

  // Click outside closes the dropdown.
  useEffect(() => {
    if (!showDropdown) return;
    const onMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showDropdown]);

  // Reset keyboard selection whenever the result set changes — done during
  // render (React's "adjust state on prop change" pattern) instead of an
  // effect, avoiding a synchronous setState-in-effect cascade.
  if (debouncedQuery !== lastQuery) {
    setLastQuery(debouncedQuery);
    if (activeIndex !== -1) setActiveIndex(-1);
  }

  const go = (href: string) => {
    setOpen(false);
    setValue("");
    setActiveIndex(-1);
    containerRef.current?.querySelector("input")?.blur();
    navigate(langPath(href));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query) return;
    navigate(`${langPath("/search")}?q=${encodeURIComponent(query)}`);
    setOpen(false);
    containerRef.current?.querySelector("input")?.blur();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      containerRef.current?.querySelector("input")?.blur();
      return;
    }
    if (!showDropdown) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatItems.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    } else if (
      event.key === "Enter" &&
      activeIndex >= 0 &&
      flatItems[activeIndex]
    ) {
      event.preventDefault();
      go(flatItems[activeIndex].href);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${MAX_WIDTH}`}>
      <form role="search" onSubmit={handleSubmit}>
        <label htmlFor="global-search" className="sr-only">
          {t("layout.globalSearch")}
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-[13px] top-1/2 h-4 w-4 -translate-y-1/2 text-content-disabled"
        />
        <input
          id="global-search"
          type="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            if (searchEnabled) setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={t("layout.searchPlaceholder")}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="global-search-results"
          aria-activedescendant={
            activeIndex >= 0 ? `gs-item-${activeIndex}` : undefined
          }
          className={`
            h-[38px] w-full rounded-[22px] border-[1.5px] border-border
            bg-surface-alt px-[14px] pl-[37px] text-[13.4px] text-content
            placeholder:text-content-disabled
            focus:border-primary-700 focus:bg-surface focus:shadow-xs focus:outline-none
          `}
        />
      </form>

      {showDropdown && (
        <div
          id="global-search-results"
          role="listbox"
          aria-label={t("layout.searchResults")}
          className="absolute inset-x-0 top-full z-50 mt-2 flex max-h-[380px] flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-lg"
        >
          <div className="flex-1 overflow-y-auto py-1.5">
            {isPending && (
              <div className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-content-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t("layout.searchPending")}
              </div>
            )}

            {!isPending && flatItems.length === 0 && (
              <div className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-content-muted">
                <SearchX
                  className="h-4 w-4 text-content-disabled"
                  aria-hidden="true"
                />
                {t("layout.searchEmpty", { query: debouncedQuery || query })}
              </div>
            )}

            {!isPending &&
              groups.map((group) => {
                const Icon = ENTITY_META[group.entity].icon;
                return (
                  <div key={group.entity}>
                    <p className="px-4 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.13em] text-content-disabled">
                      {tDynamic(entityLabelKey(group.entity))}
                    </p>
                    {group.preview.map((item) => {
                      const index = flatItems.findIndex(
                        (flat) => flat.id === item.id,
                      );
                      return (
                        <button
                          key={item.id}
                          id={`gs-item-${index}`}
                          type="button"
                          role="option"
                          aria-selected={index === activeIndex}
                          onMouseDown={(event) => {
                            // mousedown so the input blur doesn't swallow the click
                            event.preventDefault();
                            go(item.href);
                          }}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors ${
                            index === activeIndex ? "bg-surface-hover" : ""
                          }`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-alt">
                            <Icon
                              className="h-3.5 w-3.5 text-content-secondary"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-content">
                              <Highlight
                                text={item.title}
                                query={debouncedQuery}
                              />
                            </span>
                            {item.subtitle && (
                              <span className="block truncate text-[11px] text-content-muted">
                                <Highlight
                                  text={item.subtitle}
                                  query={debouncedQuery}
                                />
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
          </div>

          {query && (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                navigate(
                  `${langPath("/search")}?q=${encodeURIComponent(query)}`,
                );
                setOpen(false);
                containerRef.current?.querySelector("input")?.blur();
              }}
              className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-2.5 text-[12.5px] font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              {t("layout.searchViewAllQuery", { query })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
