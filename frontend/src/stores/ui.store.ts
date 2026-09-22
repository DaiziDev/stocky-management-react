import { create } from "zustand";

interface UIState {
  /** Mobile (<900px) sidebar drawer visibility. Desktop is always visible via CSS. */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  closeSidebar: () => void;

  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>;
  addNotification: (
    notification: Omit<UIState["notifications"][0], "id">,
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  closeSidebar: () => set({ sidebarOpen: false }),

  activeModal: null,
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),

  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: crypto.randomUUID() },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
