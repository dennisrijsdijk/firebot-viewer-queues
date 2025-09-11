import globals from "../globals";
import { ViewerQueueDatabase } from "./database";

export default function setupBackend() {
    const database = new ViewerQueueDatabase();
    globals.database = database;
}