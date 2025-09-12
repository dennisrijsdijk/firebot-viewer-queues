import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { Params } from "./globals";

import globals from "./globals";
import setupBackend from "./backend";
import setupFrontend from "./frontend";

const script: Firebot.CustomScript<Params> = {
  getScriptManifest: () => {
    return {
      name: "Viewer Queues",
      description: "A Firebot plugin which provides an easy-to-use viewer queue system.",
      author: "DennisOnTheInternet",
      version: "1.0",
      firebotVersion: "5",
      startupOnly: true
    };
  },
  getDefaultParameters: () => {
    return {};
  },
  run: async (runRequest) => {
    globals.runRequest = runRequest;
    // @ts-expect-error
    if (runRequest.scriptDataDir) {
      // @ts-expect-error
      globals.scriptDataDir = runRequest.scriptDataDir;
    } else {
      const scriptNameNormalized = (await script.getScriptManifest()).name.replace(/[#%&{}\\<>*?/$!'":@`|=\s-]+/g, "-").toLowerCase();
      globals.scriptDataDir = runRequest.modules.path.join(SCRIPTS_DIR, "..", "script-data", scriptNameNormalized);
    }
    if (!runRequest.modules.fs.existsSync(globals.scriptDataDir)) {
      runRequest.modules.fs.mkdirSync(globals.scriptDataDir, { recursive: true });
    }

    await setupBackend();
    setupFrontend();
  },
};

export default script;
