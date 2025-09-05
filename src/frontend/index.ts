import factories from "./factories";
import filters from "./filters";
import globals from "../globals";

export default function setupFrontend() {
    globals.runRequest.modules.uiExtensionManager.registerUIExtension({
        id: "dennisontheinternet:viewer-queues",
        pages: [],
        providers: {
            factories,
            filters
        }
    });
}