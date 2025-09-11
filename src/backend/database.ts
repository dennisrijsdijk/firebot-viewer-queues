import globals from '../globals';
import { randomUUID } from 'node:crypto';

const types = ["queue", "stack", "random"] as const;

const avatarUrl = "https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg";

const dennisontheinternet = { id: "452884554", username: "dennisontheinternet", displayName: "DennisOnTheInternet", avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/fa9fce69-8251-4983-9cd0-fc88c1c16e98-profile_image-300x300.png" };

function generateViewer(index: number): QueueViewer {
    return { id: index.toString(), username: `user${index}`, displayName: `User ${index}`, avatarUrl };
}

function generateRandomQueues(queues: 5): Record<string, ViewerQueue> {
    const result: Record<string, ViewerQueue> = {};
    for (let i = 0; i < queues; i++) {
        const id = randomUUID();
        const name = `Queue ${i + 1}`;
        const type = types[Math.floor(Math.random() * types.length)];
        const viewerCount = Math.floor(Math.random() * (20) + 5);
        const queueViewers = Array.from({ length: viewerCount }, (_, i) => generateViewer(i + 1));
        if (Math.random() > 0.3) {
            queueViewers.push(dennisontheinternet);
        }
        result[id] = { id, name, type, viewers: queueViewers.sort(() => 0.5 - Math.random()), open: Math.random() < 0.5 };
    }
    return result;
}

let mockDatabase: DatabaseSchema;

function sendQueueUpdate(queue: ViewerQueue) {
    globals.frontendCommunicator.send("queueUpdated", queue);
}

export class ViewerQueueDatabase {
    addViewer(queueId: string, viewer: QueueViewer): boolean {
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
    }

    clearQueue(queueId: string): boolean {
        const queue = mockDatabase.queues[queueId];
        if (!queue) {
            return false;
        }
        queue.viewers = [];
        sendQueueUpdate(queue);
        return true;
    }

    toggleQueue(queueId: string): boolean {
        const queue = mockDatabase.queues[queueId];
        if (!queue) {
            return;
        }
        queue.open = !queue.open;
        sendQueueUpdate(queue);
        return queue.open;
    }

    deleteQueue(queueId: string): boolean {
        const queue = mockDatabase.queues[queueId];
        if (!queue) {
            return false;
        }
        delete mockDatabase.queues[queueId];
        return true;
    }

    getLayout(): DatabaseSchema["layout"] {
        return mockDatabase.layout;
    }

    getQueues(): DatabaseSchema["queues"] {
        return mockDatabase.queues;
    }

    removeViewer(queueId: string, viewerId: string): boolean {
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
    }

    rollViewers(queueId: string, count: number): QueueViewer[] | undefined {
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
    }

    updateQueueName(queueId: string, name: string): void {
        const queue = mockDatabase.queues[queueId];
        if (!queue) {
            return;
        }
        queue.name = name;
        sendQueueUpdate(queue);
    }

    updateQueueType(queueId: string, type: QueueType): void {
        const queue = mockDatabase.queues[queueId];
        if (!queue) {
            return;
        }
        queue.type = type;
        sendQueueUpdate(queue);
    }

    getQueue(id: string): ViewerQueue | undefined {
        return mockDatabase.queues[id];
    }

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
        globals.frontendCommunicator.on("addViewer", async (queueId: string, viewer: QueueViewer) => this.addViewer(queueId, viewer));
        globals.frontendCommunicator.on("clearQueue", async (queueId: string) => this.clearQueue(queueId));
        globals.frontendCommunicator.on("toggleQueue", async (queueId: string) => this.toggleQueue(queueId));
        globals.frontendCommunicator.on("deleteQueue", async (queueId: string) => this.deleteQueue(queueId));
        globals.frontendCommunicator.on("getLayout", async () => mockDatabase.layout);
        globals.frontendCommunicator.on("getQueues", async () => this.getQueues());
        globals.frontendCommunicator.on("removeViewer", async (queueId: string, viewerId: string) => this.removeViewer(queueId, viewerId));
        globals.frontendCommunicator.on("rollViewers", async (queueId: string, count: number) => this.rollViewers(queueId, count));
        globals.frontendCommunicator.on("updateLayout", async (layout: DatabaseSchema["layout"]) => { mockDatabase.layout = layout; });
        globals.frontendCommunicator.on("updateQueueName", async (queueId: string, name: string) => this.updateQueueName(queueId, name));
        globals.frontendCommunicator.on("updateQueueType", async (queueId: string, type: QueueType) => this.updateQueueType(queueId, type));

        mockDatabase = {
            queues: generateRandomQueues(5),
            layout: {
                queuesTable: "50%",
                viewerList: "50%"
            }
        };
    }
}