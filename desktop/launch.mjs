import { APP_URL, ensureBuild, isMain, isUp, openWindow, startServeDetached, waitUntilUp } from "./lib.mjs";

async function main() {
  const open = !process.argv.includes("--no-open");
  if (!(await isUp())) {
    await ensureBuild();
    if (!(await isUp())) startServeDetached();
    const ready = await waitUntilUp();
    if (!ready) {
      throw new Error(`Project Hub did not come up at ${APP_URL}.`);
    }
  }
  if (open) await openWindow();
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
