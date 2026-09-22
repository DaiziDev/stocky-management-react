import { z } from 'zod';

export const DashboardSchema = z.object({
  id: z.string().optional(),
});

export type DashboardFormData = z.infer<typeof DashboardSchema>;