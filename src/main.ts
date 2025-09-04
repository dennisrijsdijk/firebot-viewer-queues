import { Firebot } from "@crowbartools/firebot-custom-scripts-types";

interface Params { }

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
    return { };
  },
  run: (runRequest) => { },
};

export default script;
