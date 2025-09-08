import globals from '../globals';
import { randomUUID } from 'node:crypto';

const types = ["queue", "stack", "random"] as const;

const avatarUrl = "https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg";

const viewers: QueueViewer[] = [
    { id: "1", username: "user1", displayName: "User One", avatarUrl },
    { id: "2", username: "user2", displayName: "User Two", avatarUrl },
    { id: "3", username: "user3", displayName: "User Three", avatarUrl },
    { id: "4", username: "user4", displayName: "User Four", avatarUrl },
    { id: "5", username: "user5", displayName: "User Five", avatarUrl },
    { id: "6", username: "user6", displayName: "User Six", avatarUrl },
    { id: "7", username: "user7", displayName: "User Seven", avatarUrl },
    { id: "8", username: "user8", displayName: "User Eight", avatarUrl },
    { id: "9", username: "user9", displayName: "User Nine", avatarUrl },
    { id: "10", username: "user10", displayName: "User Ten", avatarUrl },
];

function generateRandomQueues(queues: 5): Record<string, ViewerQueue> {
    const result: Record<string, ViewerQueue> = {};
    for (let i = 0; i < queues; i++) {
        const id = randomUUID();
        const name = `Queue ${i + 1}`;
        const type = types[Math.floor(Math.random() * types.length)];
        const viewerCount = Math.floor(Math.random() * (5) + 1);
        const queueViewers = viewers.sort(() => 0.5 - Math.random()).slice(0, viewerCount);
        //const queueViewers = viewers.slice(0, viewerCount);
        result[id] = { id, name, type, viewers: queueViewers, open: Math.random() < 0.5 };
    }
    return result;
}

const mockDatabase: DatabaseSchema = {
    queues: generateRandomQueues(5),
    layout: {
        queuesTable: "50%",
        viewerList: "50%"
    }
};

function sendQueueUpdate(queue: ViewerQueue) {
    globals.frontendCommunicator.send("queueUpdated", queue);
}

class ViewerQueueDatabase {
    constructor() {
        globals.frontendCommunicator.on("addQueue", async (queue: ViewerQueue) => {
            let id: string;
            do {
                id = crypto.randomUUID();
            } while (mockDatabase.queues[id]);
            queue.id = id;

            mockDatabase.queues[id] = queue;

            return queue;
        });
        globals.frontendCommunicator.on("addViewer", async (queueId: string, viewer: QueueViewer) => {
            const queue = mockDatabase.queues[queueId];
            if (!queue) {
                return false;
            }
            if (queue.viewers.find(v => v.id === viewer.id)) {
                return false;
            }
            queue.viewers.push(viewer);
            sendQueueUpdate(queue);
            return true;
        });
        globals.frontendCommunicator.on("clearQueue", async (queueId: string) => {
            const queue = mockDatabase.queues[queueId];
            if (!queue) {
                return false;;
            }
            queue.viewers = [];
            sendQueueUpdate(queue);
            return true;
        });
        globals.frontendCommunicator.on("toggleQueue", async (queueId: string) => {
            const queue = mockDatabase.queues[queueId];
            if (!queue) {
                return;
            }
            queue.open = !queue.open;
            sendQueueUpdate(queue);
        });
        globals.frontendCommunicator.on("deleteQueue", async (queueId: string) => {
            const queue = mockDatabase.queues[queueId];
            if (!queue) {
                return false;
            }
            delete mockDatabase.queues[queueId];
            return true;
        });
        globals.frontendCommunicator.on("getLayout", async () => {
            return mockDatabase.layout;
        });
        globals.frontendCommunicator.on("getQueues", async () => {
            return mockDatabase.queues;
        });
        globals.frontendCommunicator.on("removeViewer", async (queueId: string, viewerId: string) => {
            const queue = mockDatabase.queues[queueId];
            if (!queue) {
                return false;
            }
            const viewerIndex = queue.viewers.findIndex(v => v.id === viewerId);
            if (viewerIndex === -1) {
                return false;
            }
            queue.viewers.splice(viewerIndex, 1);
            sendQueueUpdate(queue);
            return true;
        });
        globals.frontendCommunicator.on("rollViewers", async (queueId: string, count: number) => {
            const queue = mockDatabase.queues[queueId];
            if (!queue) {
                return;
            }
            if (queue.viewers.length === 0) {
                return;
            }
            const pickedViewers: QueueViewer[] = [];
            switch (queue.type) {
                case "queue":
                    pickedViewers.push(...queue.viewers.splice(0, count));
                    break;
                case "stack":
                    pickedViewers.push(...queue.viewers.splice(-count).reverse());
                    break;
                case "random":
                    for (let i = 0; i < count; i++) {
                        if (queue.viewers.length === 0) {
                            break;
                        }
                        const index = Math.floor(Math.random() * queue.viewers.length);
                        pickedViewers.push(queue.viewers.splice(index, 1)[0]);
                    }
                    break;
            }
            sendQueueUpdate(queue);
            return pickedViewers;
        });
        globals.frontendCommunicator.on("updateLayout", async (layout: DatabaseSchema["layout"]) => {
            mockDatabase.layout = layout;
        });
        globals.frontendCommunicator.on("updateQueueName", async (queueId: string, name: string) => {
            const queue = mockDatabase.queues[queueId];
            if (!queue) {
                return;
            }
            queue.name = name;
            sendQueueUpdate(queue);
        });
        globals.frontendCommunicator.on("updateQueueType", async (queueId: string, type: QueueType) => {
            const queue = mockDatabase.queues[queueId];
            if (!queue) {
                return;
            }
            queue.type = type;
            sendQueueUpdate(queue);
        });
    }
}

let database: ViewerQueueDatabase | null = null;

export default database;

export async function setupDatabase() {
    if (database) return;
    database = new ViewerQueueDatabase();
}