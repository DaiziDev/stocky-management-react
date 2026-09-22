/**
 * Notifications — real shapes pinned from swagger.json (roadmap P0.2 / P6.3).
 *
 * Backend contract (swagger v1.0):
 *   GET /api/notifications → NotificationDTO[]  («notifications actives»)
 *
 * NOTE: the DTO has NO id, NO read/unread flag, and the endpoint has NO
 * mark-as-read/PUT/delete operations — notifications are server-managed
 * "active alerts" (e.g. stock thresholds). The client therefore:
 *  - shows a live count in the Header bell (polling, not sockets)
 *  - lists the active notifications with links to the articles concerned
 *  - does NOT implement mark-as-read until the backend exposes it
 */

/** Raw response body of GET /api/notifications — swagger `NotificationDTO`. */
export interface NotificationDTO {
  /** Free-form type label sent by the backend (e.g. «STOCK_BAS»). */
  type: string;
  message: string;
  articleId?: number;
  articleDesignation?: string;
}

/**
 * Domain notification — mapped in ../api/mappers.ts.
 * The backend sends no id, so the (type, message, articleId) triple is the
 * React key. Type alias for consistency with the other feature models.
 */
export type AppNotification = {
  /** Backend type label, humanized for display when unknown. */
  type: string;
  message: string;
  articleId: string | null;
  articleDesignation: string | null;
};
