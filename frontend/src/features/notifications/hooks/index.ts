import { useQuery } from "@tanstack/react-query";
import { NotificationsApi } from "../api";

/** Query-key factory. */
export const notificationsKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationsKeys.all, "list"] as const,
};

/**
 * Active notifications. Polled every 60s so the Header bell stays live
 * without sockets; refetched on window focus as a bonus.
 */
export const useNotifications = () => {
  return useQuery({
    queryKey: notificationsKeys.list(),
    queryFn: () => NotificationsApi.getAll(),
    refetchInterval: 60_000,
  });
};
