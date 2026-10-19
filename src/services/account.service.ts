import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";

export const accountService = {
  async deleteAccount(userId: string): Promise<void> {
    const { error } = await getAdminClient().auth.admin.deleteUser(userId);
    if (error) throw error;
  },
};
