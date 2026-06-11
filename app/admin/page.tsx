import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const loggedIn = await requireAdminSession();
  return <AdminDashboard loggedIn={loggedIn} />;
}
