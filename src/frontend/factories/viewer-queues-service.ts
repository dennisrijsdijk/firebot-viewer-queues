import { AngularJsFactory } from "@crowbartools/firebot-custom-scripts-types/types/modules/ui-extension-manager";
import { type VqBackendService } from "./vq-backend";

export type ViewerQueuesService = {
    selectedQueueId?: string;
    queues: DatabaseSchema["queues"];
    queuesArray: ViewerQueue[];
    getQueues: () => Promise<DatabaseSchema["queues"]>;
    addOrEditQueue: (queue?: ViewerQueue) => void;
    addViewerToQueue: (queueId: string) => void;
    removeViewerFromQueue: (queueId: string, viewerId: string) => void;
    deleteQueue: (queueId: string) => void;
    clearQueue: (queueId: string) => void;
    rollViewers: (queueId: string, count: number) => void;
};

const service: AngularJsFactory = {
    name: "viewerQueuesService",
    function: (vqBackend: VqBackendService, utilityService: any) => {
        const service: Partial<ViewerQueuesService> = {
            queues: {},
            queuesArray: [],
            getQueues: async () => {
                service.queues = await vqBackend.send("getQueues");
                service.queuesArray = Object.values(service.queues);
                service.queuesArray.forEach(queue => {
                    if (queue.type === "stack" && queue.viewers.length > 0) {
                        queue.viewers.reverse();
                    }
                });
                if (!service.selectedQueueId && service.queuesArray.length > 0) {
                    service.selectedQueueId = service.queuesArray[0].id;
                }
                return service.queues;
            },
            addOrEditQueue: (queue) => {
                utilityService.showModal({
                component: "addOrEditViewerQueueModal",
                breadcrumbName: "Add or Edit Viewer Queue",
                size: "sm",
                backdrop: true,
                resolveObj: {
                    model: () => queue
                },
                closeCallback: (resp: any) => {}
            });
            },
            addViewerToQueue: () => {
                if (!service.selectedQueueId) {
                    return;
                }
                utilityService.openViewerSearchModal({
                    label: "Add Viewer to Queue",
                    saveText: "Add",
                    validationFn: (viewer: QueueViewer) => {
                        if (!viewer) {
                            return false;
                        }

                        return service.queues[service.selectedQueueId].viewers.every(v => v.id !== viewer.id);
                    }
                }, (viewer: QueueViewer) => {
                    vqBackend.send("addViewer", service.selectedQueueId, viewer);
                });
            },
            removeViewerFromQueue: (viewerId) => {
                if (!service.selectedQueueId) {
                    return;
                }
                vqBackend.send("removeViewer", service.selectedQueueId, viewerId);
            },
            deleteQueue: (queueId) => {
                utilityService.showConfirmationModal({
                    title: "Delete Queue",
                    question: "Are you sure you want to delete this queue? This action cannot be undone.",
                    confirmLabel: "Delete",
                    confirmBtnType: "btn-danger"
                }).then((confirmed: boolean) => {
                    if (confirmed) {
                        vqBackend.send("deleteQueue", queueId);
                        delete service.queues[queueId];
                        service.queuesArray = Object.values(service.queues);
                        if (service.selectedQueueId === queueId) {
                            service.selectedQueueId = service.queuesArray.length > 0 ? service.queuesArray[0].id : undefined;
                        }
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
                        vqBackend.send("clearQueue", queueId);
                    }
                });
            },
            rollViewers: (queueId, count) => {
                vqBackend.send("rollViewers", queueId, count);
            }
        };

        service.getQueues();

        vqBackend.on("queueUpdated", async (queue) => {
            if (queue.type === "stack" && queue.viewers.length > 0) {
                queue.viewers.reverse();
            }
            service.queues[queue.id!] = queue;
            service.queuesArray = Object.values(service.queues);
        });

        return service;
    }
};

export default service;