import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const assetsDir = path.join(projectRoot, "dist", "server", "assets");
const outDir = path.join(projectRoot, ".wrangler", "tanstack-aliases");

const entries = await fs.readdir(assetsDir);
const findAsset = (prefix) => {
  const match = entries.find((name) => name.startsWith(prefix) && name.endsWith(".js"));
  if (!match) {
    throw new Error(`Missing expected asset: ${prefix}*.js`);
  }
  return match;
};

const routerAsset = findAsset("router-");
const startAsset = findAsset("start-");
const pluginAdaptersAsset = findAsset("__23tanstack-start-plugin-adapters-");
const startManifestAsset = findAsset("_tanstack-start-manifest_v-");

await fs.mkdir(outDir, { recursive: true });

const rel = (asset) =>
  path.posix.join("..", "..", "dist", "server", "assets", asset);

await fs.writeFile(
  path.join(outDir, "router-entry.mjs"),
  `import { r as router } from "${rel(routerAsset)}";\nexport const getRouter = router.getRouter;\n`,
);

await fs.writeFile(
  path.join(outDir, "start-entry.mjs"),
  `export { startInstance } from "${rel(startAsset)}";\n`,
);

await fs.writeFile(
  path.join(outDir, "plugin-adapters.mjs"),
  `export { hasPluginAdapters, pluginSerializationAdapters } from "${rel(pluginAdaptersAsset)}";\n`,
);

await fs.writeFile(
  path.join(outDir, "start-manifest.mjs"),
  `export { tsrStartManifest } from "${rel(startManifestAsset)}";\n`,
);

await fs.writeFile(
  path.join(outDir, "injected-head-scripts.mjs"),
  "export const injectedHeadScripts = undefined;\n",
);
