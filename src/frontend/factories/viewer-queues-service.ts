import { AngularJsFactory } from "@crowbartools/firebot-custom-scripts-types/types/modules/ui-extension-manager";

type ViewerQueuesService = {
    queues: DatabaseSchema["queues"];
    getQueues: () => Promise<DatabaseSchema["queues"]>;
    addOrEditQueue: (queue?: ViewerQueue) => void;
    addViewerToQueue: (queueId: string) => void;
    removeViewerFromQueue: (queueId: string, viewerId: string) => void;
    deleteQueue: (queueId: string) => void;
    clearQueue: (queueId: string) => void;
    rollViewers: (queueId: string, count: number) => void;
    rollViewer: (queueId: string, viewerId: string) => Promise<boolean>;
};

const service: AngularJsFactory = {
    name: "viewerQueuesService",
    function: (backendCommunicator: any, utilityService: any) => {
        const backendCommunicatorShim = {
            on<T extends keyof FrontendCommunicatorCommands>(request: T, callback: (...args: FrontendCommunicatorCommands[T]["args"]) => Promise<FrontendCommunicatorCommands[T]["returns"]>) {
                backendCommunicator.onAsync(request, (args: FrontendCommunicatorCommands[T]["args"]) => callback(...args));
            },
            async send<T extends keyof BackendCommunicatorCommands>(request: T, ...args: BackendCommunicatorCommands[T]["args"]) {
                return await backendCommunicator.fireEventAsync(request, args) as BackendCommunicatorCommands[T]["returns"];
            }
        }
        const service: Partial<ViewerQueuesService> = {
            queues: {},
            getQueues: async () => {
                service.queues = await backendCommunicatorShim.send("getQueues");
                return service.queues;
            },
            addOrEditQueue: (queue) => {
                // Show modal to add or edit a queue
            },
            addViewerToQueue: (queueId) => {
                utilityService.openViewerSearchModal({
                    label: "Add Viewer to Queue",
                    saveText: "Add",
                    validationFn: (viewer: QueueViewer) => {
                        if (!viewer) {
                            return false;
                        }

                        return service.queues[queueId].viewers.every(v => v.id !== viewer.id);
                    }
                }, (viewer: QueueViewer) => {
                    backendCommunicatorShim.send("addViewer", queueId, viewer);
                });
            },
            removeViewerFromQueue: (queueId, viewerId) => {
                backendCommunicatorShim.send("removeViewer", queueId, viewerId);
            },
            deleteQueue: (queueId) => {
                utilityService.showConfirmationModal({
                    title: "Delete Queue",
                    question: "Are you sure you want to delete this queue? This action cannot be undone.",
                    confirmLabel: "Delete",
                    confirmBtnType: "btn-danger"
                }).then((confirmed: boolean) => {
                    if (confirmed) {
                        backendCommunicatorShim.send("deleteQueue", queueId);
                        delete service.queues[queueId];
                    }
                });
            },
            clearQueue: (queueId) => {
                utilityService.showConfirmationModal({
                    title: "Clear Queue",
                    question: "Are you sure you want to clear all viewers from this queue?",
                    confirmLabel: "Clear",
                    confirmBtnType: "btn-warning"
                }).then((confirmed: boolean) => {
                    if (confirmed) {
                        backendCommunicatorShim.send("clearQueue", queueId);
                    }
                });
            },
            rollViewers: (queueId, count) => {
                backendCommunicatorShim.send("rollViewers", queueId, count);
            },
            rollViewer: (queueId, viewerId) => {
                return backendCommunicatorShim.send("rollViewer", queueId, viewerId);
            }
        };
        return service;
    }
};

export default service;