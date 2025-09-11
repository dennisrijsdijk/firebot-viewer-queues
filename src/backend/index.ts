import globals from "../globals";
import { ViewerQueueDatabase } from "./database";
import { VqCommandManager } from "./vq-command-manager";

export default function setupBackend() {
    const database = new ViewerQueueDatabase();
    globals.database = database;

    const vqCommandManager = new VqCommandManager();
    // TODO: Store vqCommandManager if needed later
}