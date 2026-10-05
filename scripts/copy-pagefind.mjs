import { cpSync, existsSync, rmSync } from "node:fs";

const src = new URL("../dist/pagefind/", import.meta.url);
const dest = new URL("../public/pagefind/", import.meta.url);

if (!existsSync(src)) {
  process.stderr.write("dist/pagefind not found. Run `pagefind --site dist` first.\n");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
process.stdout.write("Copied dist/pagefind -> public/pagefind\n");
