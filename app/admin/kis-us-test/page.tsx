import { AdminKisTest } from "@/components/admin-kis-test";
import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminKisTestPage() {
  const loggedIn = await requireAdminSession();
  if (!loggedIn) {
    return <AdminDashboard loggedIn={false} />;
  }
  return <AdminKisTest />;
}
