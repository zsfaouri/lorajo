import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { listDriveFolders } from "@/lib/google-drive";

export async function GET(req: NextRequest) {
  const parentId = req.nextUrl.searchParams.get("parentId") || undefined;
  return withAdmin(async () => {
    return listDriveFolders(parentId);
  });
}
