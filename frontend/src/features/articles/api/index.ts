import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import { toArticle, toArticleRequest } from "./mappers";
import type { Article, ArticleResponseDTO, ArticleWrite } from "../types";

/**
 * Articles API — pinned to swagger.json:
 *
 *   GET    /api/articles        → ArticleResponseDTO[] (bare array, no Page envelope)
 *   POST   /api/articles        → ArticleResponseDTO
 *   GET    /api/articles/{id}   → ArticleResponseDTO
 *   PUT    /api/articles/{id}   → ArticleResponseDTO
 *   DELETE /api/articles/{id}   → 200
 *
 * Every method returns the domain `Article`, never raw DTOs: responses are
 * mapped (int64 ids → string, TTC price recomputed) and unwrapped from the
 * Axios envelope here, so hooks and components consume plain data.
 */
export const ArticlesApi = {
  /** No query params in swagger v1.0 — the backend returns every article (bare array). */
  getAll: async (): Promise<Article[]> => {
    const res = await apiClient.get<ArticleResponseDTO[]>(
      API_ENDPOINTS.ARTICLES,
    );
    return res.data.map(toArticle);
  },

  getById: async (id: string): Promise<Article> => {
    const res = await apiClient.get<ArticleResponseDTO>(
      API_ENDPOINTS.ARTICLE(id),
    );
    return toArticle(res.data);
  },

  create: async (data: ArticleWrite): Promise<Article> => {
    const res = await apiClient.post<ArticleResponseDTO>(
      API_ENDPOINTS.ARTICLES,
      toArticleRequest(data),
    );
    return toArticle(res.data);
  },

  update: async (id: string, data: ArticleWrite): Promise<Article> => {
    const res = await apiClient.put<ArticleResponseDTO>(
      API_ENDPOINTS.ARTICLE(id),
      toArticleRequest(data),
    );
    return toArticle(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.ARTICLE(id));
  },
};
