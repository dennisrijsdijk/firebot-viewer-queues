// Backend -> Frontend
type FrontendCommunicatorCommands = {
    queueUpdated: {
        args: [ queue: ViewerQueue ];
        returns: void;
    };
}

// Frontend -> Backend
type BackendCommunicatorCommands = {
    addViewer: {
        args: [ queueId: string, viewer: QueueViewer ];
        returns: void;
    };
    removeViewer: {
        args: [ queueId: string, viewerId: string ];
        returns: void;
    };
    addQueue: {
        args: [ queue: Omit<ViewerQueue, "id"> ];
        returns: ViewerQueue;
    };
    deleteQueue: {
        args: [ queueId: string ];
        returns: void;
    };
    clearQueue: {
        args: [ queueId: string ];
        returns: void;
    };
    updateQueueType: {
        args: [ queueId: string, type: QueueType ];
        returns: void;
    };
    getQueues: {
        args: [];
        returns: DatabaseSchema["queues"];
    };
    rollViewers: {
        args: [ queueId: string, count: number ];
        returns: void;
    };
    rollViewer: {
        args: [ queueId: string, viewerId: string ];
        returns: boolean;
    };
}