import type { AppNotification, NotificationDTO } from "../types";

/** `NotificationDTO` → `AppNotification` (int64 articleId → string). */
export function toNotification(dto: NotificationDTO): AppNotification {
  return {
    type: dto.type,
    message: dto.message,
    articleId: dto.articleId != null ? String(dto.articleId) : null,
    articleDesignation: dto.articleDesignation ?? null,
  };
}
