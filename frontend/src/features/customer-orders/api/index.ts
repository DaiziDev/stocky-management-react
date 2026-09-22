import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import { toCommandeClientRequest, toCustomerOrder } from "./mappers";
import type {
  CommandeClientResponseDTO,
  CustomerOrder,
  CustomerOrderWrite,
} from "../types";

/**
 * Customer orders API — pinned to swagger.json (backend resource: «commandes-client»):
 *
 *   GET    /api/commandes-client                → CommandeClientResponseDTO[] (bare array)
 *   POST   /api/commandes-client                → CommandeClientResponseDTO (order + lines in one request, statut EN_COURS)
 *   GET    /api/commandes-client/{id}           → CommandeClientResponseDTO
 *   PUT    /api/commandes-client/{id}/valider   → CommandeClientResponseDTO (409 if stock insufficient)
 *   PUT    /api/commandes-client/{id}/annuler   → CommandeClientResponseDTO (only while EN_COURS)
 *
 * There is no delete endpoint — cancellation is the terminal flow. Every
 * method returns the domain `CustomerOrder`, never raw DTOs.
 */
export const CustomerOrdersApi = {
  getAll: async (): Promise<CustomerOrder[]> => {
    const res = await apiClient.get<CommandeClientResponseDTO[]>(
      API_ENDPOINTS.CUSTOMER_ORDERS,
    );
    return res.data.map(toCustomerOrder);
  },

  getById: async (id: string): Promise<CustomerOrder> => {
    const res = await apiClient.get<CommandeClientResponseDTO>(
      API_ENDPOINTS.CUSTOMER_ORDER(id),
    );
    return toCustomerOrder(res.data);
  },

  create: async (input: CustomerOrderWrite): Promise<CustomerOrder> => {
    const res = await apiClient.post<CommandeClientResponseDTO>(
      API_ENDPOINTS.CUSTOMER_ORDERS,
      toCommandeClientRequest(input),
    );
    return toCustomerOrder(res.data);
  },

  /** PUT /{id}/valider — generates a stock exit per line; 409 when stock is insufficient. */
  validate: async (id: string): Promise<CustomerOrder> => {
    const res = await apiClient.put<CommandeClientResponseDTO>(
      API_ENDPOINTS.CUSTOMER_ORDER_VALIDATE(id),
    );
    return toCustomerOrder(res.data);
  },

  /** PUT /{id}/expedier — VALIDEE → EXPEDIEE. */
  ship: async (id: string): Promise<CustomerOrder> => {
    const res = await apiClient.put<CommandeClientResponseDTO>(
      API_ENDPOINTS.CUSTOMER_ORDER_SHIP(id),
    );
    return toCustomerOrder(res.data);
  },

  /** PUT /{id}/livrer — EXPEDIEE → LIVREE (terminal). */
  deliver: async (id: string): Promise<CustomerOrder> => {
    const res = await apiClient.put<CommandeClientResponseDTO>(
      API_ENDPOINTS.CUSTOMER_ORDER_DELIVER(id),
    );
    return toCustomerOrder(res.data);
  },

  /** PUT /{id}/annuler — allowed only while the order is EN_COURS. */
  cancel: async (id: string): Promise<CustomerOrder> => {
    const res = await apiClient.put<CommandeClientResponseDTO>(
      API_ENDPOINTS.CUSTOMER_ORDER_CANCEL(id),
    );
    return toCustomerOrder(res.data);
  },
};
