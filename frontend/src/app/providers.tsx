import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache,
} from "@tanstack/react-query";
import { Toaster } from "sonner";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { toastError } from "@/lib/toast";
import { getErrorMessage } from "@/lib/error-handler";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Global error surface for queries: one toast per failing query key,
    // deduplicated by the cache itself (onError fires once per error state).
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  }),
  mutationCache: new MutationCache({
    // Global error surface for mutations. Forms that surface field errors
    // inline mark their errors with `{ handled: true }` and skip the toast.
    onError: (error) => {
      if ((error as { handled?: boolean })?.handled) return;
      toastError(getErrorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              classNames: {
                success: "border-l-4 border-l-success-500",
                error: "border-l-4 border-l-danger-500",
                warning: "border-l-4 border-l-warning-500",
                info: "border-l-4 border-l-primary-500",
              },
            }}
          />
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
};
