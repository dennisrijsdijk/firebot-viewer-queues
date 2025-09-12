import { AngularJsComponent } from "@crowbartools/firebot-custom-scripts-types/types/modules/ui-extension-manager";
import template from "./index.html";
import { type ViewerQueuesService } from "../../factories/viewer-queues-service";
import { VqBackendService } from "../../factories/vq-backend";

type Scope = ng.IScope & {
    $ctrl: any;
    oldViewerQueue: ViewerQueue;
    viewerQueue: ViewerQueue;
    viewerQueueSettings: any;
    queueCommand: string;
}

const component: AngularJsComponent = {
    name: "addOrEditViewerQueueModal",
    template,
    bindings: {
        resolve: "<",
        close: "&",
        dismiss: "&",
        modalInstance: "<"
    },
    //controller: function ($scope: Scope, commandsService: any, viewerQueuesService: ViewerQueuesService, logger: any) {
    controller: ($scope: Scope, viewerQueuesService: ViewerQueuesService, vqBackend: VqBackendService, logger: any) => {
        const $ctrl = $scope.$ctrl;
        $scope.queueCommand = "!exampleQueueCommand";

        $scope.viewerQueue = {
            name: "",
            open: true,
            type: "queue",
            viewers: []
        };

        $ctrl.$onInit = () => {
            if ($ctrl.resolve.model != null) {
                $scope.viewerQueue = structuredClone($ctrl.resolve.model);
                $scope.oldViewerQueue = structuredClone($ctrl.resolve.model);
            }
        };

        $ctrl.$onDestroy = () => {

        };

        $ctrl.formFieldHasError = (fieldName: string) => {
            return $scope.viewerQueueSettings.$submitted
                || $scope.viewerQueueSettings[fieldName]?.$touched
                && $scope.viewerQueueSettings[fieldName]?.$invalid;
        }

        $ctrl.nameIsTaken = (name: string) => {
            if (name == null || name === "") {
                return false;
            }
            const queues = viewerQueuesService.queuesArray;
            const lowerName = name.toLowerCase().replaceAll(" ", "");
            const queue = queues.find((queue: ViewerQueue) => queue.name.toLowerCase().replaceAll(" ", "") === lowerName);

            return queue != null && queue.id !== $scope.viewerQueue.id;
        }

        $ctrl.save = async () => {
            if ($scope.viewerQueueSettings.$invalid) {
                logger.debug("Form is invalid");
                return;
            }

            //viewerQueuesService.saveQueue($scope.viewerQueue).then($ctrl.dismiss);
            if (!$scope.oldViewerQueue) {
                vqBackend.send("addQueue", $scope.viewerQueue).then((queue) => {
                    viewerQueuesService.queues[queue.id] = queue;
                    viewerQueuesService.queuesArray = Object.values(viewerQueuesService.queues);
                    $ctrl.dismiss();
                });
            } else {
                if ($scope.viewerQueue.name !== $scope.oldViewerQueue.name) {
                    await vqBackend.send("updateQueueName", $scope.viewerQueue.id, $scope.viewerQueue.name);
                }
                if ($scope.viewerQueue.type !== $scope.oldViewerQueue.type) {
                    await vqBackend.send("updateQueueType", $scope.viewerQueue.id, $scope.viewerQueue.type);
                }
                $ctrl.dismiss();
            }
        }
    }
};

export default component;