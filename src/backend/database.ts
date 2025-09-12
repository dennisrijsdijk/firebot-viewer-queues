import { EventEmitter } from "node:events";
import globals from '../globals';
import { randomUUID } from 'node:crypto';
import { JsonDB, Config } from 'node-json-db';

const types = ["queue", "stack", "random"] as const;

function sendQueueUpdate(queue: ViewerQueue) {
    globals.frontendCommunicator.send("queueUpdated", queue);
}

export class ViewerQueueDatabase extends EventEmitter {
    private _db: JsonDB;

    async addViewer(queueId: string, viewer: QueueViewer): Promise<boolean> {
        const queue = await this._db.getObject<ViewerQueue>(`/queues/${queueId}`);
        if (!queue) {
            return false;
        }
        if (queue.viewers.find(v => v.id === viewer.id)) {
            return false;
        }
        queue.viewers.push(viewer);
        await this._db.push(`/queues/${queueId}`, queue);
        sendQueueUpdate(queue);
        return true;
    }

    async addQueue(queue: ViewerQueue): Promise<ViewerQueue> {
        const queues = await this._db.getObject<DatabaseSchema["queues"]>("/queues");
        let id: string;
        do {
            id = randomUUID();
        } while (queues[id]);
        queue.id = id;
        await this._db.push(`/queues/${id}`, queue);
        this.emit("queueAdded", queue);
        return queue;
    }

    async clearQueue(queueId: string): Promise<boolean> {
        const queue = await this._db.getObject<ViewerQueue>(`/queues/${queueId}`);
        if (!queue) {
            return false;
        }
        queue.viewers = [];
        await this._db.push(`/queues/${queueId}`, queue);
        sendQueueUpdate(queue);
        return true;
    }

    async toggleQueue(queueId: string): Promise<boolean | undefined> {
        const queue = await this._db.getObject<ViewerQueue>(`/queues/${queueId}`);
        if (!queue) {
            return;
        }
        queue.open = !queue.open;
        await this._db.push(`/queues/${queueId}`, queue);
        sendQueueUpdate(queue);
        return queue.open;
    }

    async deleteQueue(queueId: string): Promise<boolean> {
        const queue = await this._db.getObject<ViewerQueue>(`/queues/${queueId}`);
        if (!queue) {
            return false;
        }
        await this._db.delete(`/queues/${queueId}`);
        this.emit("queueDeleted", queueId);
        return true;
    }

    async getLayout(): Promise<DatabaseSchema["layout"]> {
        return await this._db.getObject<DatabaseSchema["layout"]>("/layout");
    }

    async getQueues(): Promise<DatabaseSchema["queues"]> {
        return await this._db.getObject<DatabaseSchema["queues"]>("/queues");
    }

    async removeViewer(queueId: string, viewerId: string): Promise<boolean> {
        const queue = await this._db.getObject<ViewerQueue>(`/queues/${queueId}`);
        if (!queue) {
            return false;
        }
        const viewerIndex = queue.viewers.findIndex(v => v.id === viewerId);
        if (viewerIndex === -1) {
            return false;
        }
        queue.viewers.splice(viewerIndex, 1);
        await this._db.push(`/queues/${queueId}`, queue);
        sendQueueUpdate(queue);
        return true;
    }

    async rollViewers(queueId: string, count: number): Promise<QueueViewer[] | undefined> {
        const queue = await this._db.getObject<ViewerQueue>(`/queues/${queueId}`);
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
        await this._db.push(`/queues/${queueId}`, queue);
        sendQueueUpdate(queue);
        return pickedViewers;
    }

    async updateLayout(layout: DatabaseSchema["layout"]): Promise<void> {
        await this._db.push("/layout", layout);
    }

    async updateQueueName(queueId: string, name: string): Promise<void> {
        const queue = await this._db.getObject<ViewerQueue>(`/queues/${queueId}`);
        if (!queue) {
            return;
        }
        queue.name = name;
        await this._db.push(`/queues/${queueId}`, queue);
        this.emit("queueUpdated", queue);
        sendQueueUpdate(queue);
    }

    async updateQueueType(queueId: string, type: QueueType): Promise<void> {
        const queue = await this._db.getObject<ViewerQueue>(`/queues/${queueId}`);
        if (!queue) {
            return;
        }
        queue.type = type;
        await this._db.push(`/queues/${queueId}`, queue);
        sendQueueUpdate(queue);
    }

    async getQueue(id: string): Promise<ViewerQueue | undefined> {
        return await this._db.getObject<ViewerQueue>(`/queues/${id}`);
    }

    async setupDatabase(): Promise<void> {
        if (!await this._db.exists("/queues")) {
            await this._db.push("/queues", {});
        }
        if (!await this._db.exists("/layout")) {
            await this._db.push("/layout", {
                queuesTable: "50%",
                viewerList: "50%"
            });
        }
    }

    constructor() {
        super();
        this._db = new JsonDB(new Config(globals.runRequest.modules.path.join(globals.scriptDataDir, "viewer-queues-db.json"), true, false, '/'));

        globals.frontendCommunicator.on("addQueue", this.addQueue);
        globals.frontendCommunicator.on("addViewer", this.addViewer);
        globals.frontendCommunicator.on("clearQueue", this.clearQueue);
        globals.frontendCommunicator.on("toggleQueue", this.toggleQueue);
        globals.frontendCommunicator.on("deleteQueue", this.deleteQueue);
        globals.frontendCommunicator.on("getLayout", this.getLayout);
        globals.frontendCommunicator.on("getQueues", this.getQueues);
        globals.frontendCommunicator.on("removeViewer", this.removeViewer);
        globals.frontendCommunicator.on("rollViewers", this.rollViewers);
        globals.frontendCommunicator.on("updateLayout", this.updateLayout);
        globals.frontendCommunicator.on("updateQueueName", this.updateQueueName);
        globals.frontendCommunicator.on("updateQueueType", this.updateQueueType);
    }
}