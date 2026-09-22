import { useQuery } from "@tanstack/react-query";
import { searchEntities } from "../api";

export const useEntitySearch = (query: string, size = 10) => {
  return useQuery({
    queryKey: ["search", query, size],
    queryFn: () => searchEntities(query, size),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });
};
