import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import { toNotification } from "./mappers";
import type { AppNotification, NotificationDTO } from "../types";

/**
 * Notifications API — pinned to swagger.json:
 *
 *   GET /api/notifications → NotificationDTO[]  («notifications actives»)
 *
 * swagger v1.0 pins NO mark-as-read/PUT/delete operations — they were
 * removed from this client until the backend exposes them. Returns the
 * domain `AppNotification`, never raw DTOs.
 */
export const NotificationsApi = {
  getAll: async (): Promise<AppNotification[]> => {
    const res = await apiClient.get<NotificationDTO[]>(
      API_ENDPOINTS.NOTIFICATIONS,
    );
    return res.data.map(toNotification);
  },
};
