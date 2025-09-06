type QueueViewer = {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
}

type QueueType = "queue" | "stack" | "random";

type ViewerQueue = {
    open: boolean;
    id?: string;
    name: string;
    type: QueueType;
    viewers: QueueViewer[];
}

type DatabaseSchema = {
    queues: Record<string, ViewerQueue>;
    layout: {
        queuesTable: string;
        viewerList: string;
    }
}