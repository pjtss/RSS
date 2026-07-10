import { AdminSecApiRunner } from "@/components/admin-sec-api-runner";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminSecTestPage() {
  const loggedIn = await requireAdminSession();
  return <AdminSecApiRunner loggedIn={loggedIn} />;
}
