import { ensureBuild, isMain, isUp, sleep, startNextForeground } from "./lib.mjs";

async function main() {
  while (true) {
    if (await isUp()) {
      await sleep(4000);
      continue;
    }
    await ensureBuild();
    if (await isUp()) continue;
    await startNextForeground();
    await sleep(2000);
  }
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
