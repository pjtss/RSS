import { createDisabledApiResponse } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  return createDisabledApiResponse("미국 종합 스캐너");
}
