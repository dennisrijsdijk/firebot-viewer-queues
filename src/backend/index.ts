import globals from "../globals";
import { ViewerQueueDatabase } from "./database";
import { VqCommandManager } from "./vq-command-manager";

export default async function setupBackend() {
    const database = new ViewerQueueDatabase();
    await database.setupDatabase();
    globals.database = database;

    const vqCommandManager = new VqCommandManager();
    // TODO: Store vqCommandManager if needed later
}