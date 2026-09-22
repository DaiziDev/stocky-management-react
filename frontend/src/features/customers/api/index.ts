import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import { toClientRequest, toCustomer } from "./mappers";
import type { ClientResponseDTO, Customer, CustomerWrite } from "../types";

/**
 * Customers API — pinned to swagger.json (backend resource: «clients»):
 *
 *   GET    /api/clients        → ClientResponseDTO[] (bare array)
 *   POST   /api/clients        → ClientResponseDTO
 *   GET    /api/clients/{id}   → ClientResponseDTO
 *   PUT    /api/clients/{id}   → ClientResponseDTO
 *   DELETE /api/clients/{id}
 *
 * Every method returns the domain `Customer`, never raw DTOs — responses are
 * mapped (int64 id → string) and unwrapped from the Axios envelope here.
 */
export const CustomersApi = {
  getAll: async (): Promise<Customer[]> => {
    const res = await apiClient.get<ClientResponseDTO[]>(
      API_ENDPOINTS.CUSTOMERS,
    );
    return res.data.map(toCustomer);
  },

  getById: async (id: string): Promise<Customer> => {
    const res = await apiClient.get<ClientResponseDTO>(
      API_ENDPOINTS.CUSTOMER(id),
    );
    return toCustomer(res.data);
  },

  create: async (input: CustomerWrite): Promise<Customer> => {
    const res = await apiClient.post<ClientResponseDTO>(
      API_ENDPOINTS.CUSTOMERS,
      toClientRequest(input),
    );
    return toCustomer(res.data);
  },

  update: async (id: string, input: CustomerWrite): Promise<Customer> => {
    const res = await apiClient.put<ClientResponseDTO>(
      API_ENDPOINTS.CUSTOMER(id),
      toClientRequest(input),
    );
    return toCustomer(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CUSTOMER(id));
  },
};
