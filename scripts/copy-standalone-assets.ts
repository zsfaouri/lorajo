import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standaloneRoot = path.join(root, ".next", "standalone");

async function copyDir(from: string, to: string) {
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to, { recursive: true, force: true });
}

async function main() {
  await copyDir(path.join(root, "public"), path.join(standaloneRoot, "public"));
  await copyDir(path.join(root, ".next", "static"), path.join(standaloneRoot, ".next", "static"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
