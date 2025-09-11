// Backend -> Frontend
type FrontendCommunicatorCommands = {
    queueUpdated: {
        args: [ queue: ViewerQueue ];
        returns: void;
    };
}

// Frontend -> Backend
type BackendCommunicatorCommands = {
    addQueue: {
        args: [ queue: ViewerQueue ];
        returns: ViewerQueue;
    };
    addViewer: {
        args: [ queueId: string, viewer: QueueViewer ];
        returns: boolean;
    };
    clearQueue: {
        args: [ queueId: string ];
        returns: boolean;
    };
    toggleQueue: {
        args: [ queueId: string ];
        returns: boolean | undefined;
    };
    deleteQueue: {
        args: [ queueId: string ];
        returns: boolean;
    };
    getLayout: {
        args: [];
        returns: DatabaseSchema["layout"];
    };
    getQueues: {
        args: [];
        returns: DatabaseSchema["queues"];
    };
    removeViewer: {
        args: [ queueId: string, viewerId: string ];
        returns: boolean;
    };
    rollViewers: {
        args: [ queueId: string, count: number ];
        returns: QueueViewer[] | undefined;
    };
    updateLayout: {
        args: [ layout: DatabaseSchema["layout"] ];
        returns: void;
    };
    updateQueueName: {
        args: [ queueId: string, name: string ];
        returns: void;
    };
    updateQueueType: {
        args: [ queueId: string, type: QueueType ];
        returns: void;
    };
}