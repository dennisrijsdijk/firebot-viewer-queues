import components from "./components";
import factories from "./factories";
import globals from "../globals";
import page from "./page";

export default function setupFrontend() {
    globals.runRequest.modules.uiExtensionManager.registerUIExtension({
        id: "dennisontheinternet:viewer-queues",
        pages: [ page ],
        providers: {
            components,
            factories
        }
    });
}