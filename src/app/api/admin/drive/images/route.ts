import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { listDriveImages } from "@/lib/google-drive";

export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get("folderId") || undefined;
  return withAdmin(async () => {
    return listDriveImages(folderId);
  });
}
