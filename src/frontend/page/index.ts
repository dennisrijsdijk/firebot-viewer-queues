import { AngularJsPage } from "@crowbartools/firebot-custom-scripts-types/types/modules/ui-extension-manager";
import template from "./index.html";
import { ViewerQueuesService } from "../factories/viewer-queues-service";
import { VqBackendService } from "../factories/vq-backend";

type TableHeader = {
    name?: string;
    icon?: `fa-${string}`;
    headerStyles?: Record<string, string>;
    cellStyles?: Record<string, string>;
    dataField?: string;
    sortable?: boolean;
    cellTemplate?: string;
    show?: boolean | ((...args: any[]) => boolean);
    cellController?: ($scope?: any, ...args: any[]) => void;
}

type SimpleMenuOption<T> = {
    html: string;
    click: (item?: T, ...args: any[]) => void;
    hasTopDivider?: boolean;
    hasBottomDivider?: boolean;
}

type ChildrenMenuOption<T> = {
    text: string;
    children: MenuOption<T>[];
    hasTopDivider?: boolean;
    hasBottomDivider?: boolean;
}

type MenuOption<T> = SimpleMenuOption<T> | ChildrenMenuOption<T>;

type Scope = ng.IScope & {
    vqs: ViewerQueuesService;
    layout: DatabaseSchema["layout"];
    queueHeaders: TableHeader[];
    orderedViewerHeaders: TableHeader[];
    unorderedViewerHeaders: TableHeader[];
    queueOptions: (queue: ViewerQueue) => MenuOption<ViewerQueue>[];
    viewerTableHeaders: (type: number) => TableHeader[];
    viewerOptions: (viewer: QueueViewer) => MenuOption<QueueViewer>[];
    onQueuesUpdated: (queues: ViewerQueue[]) => void;
    onViewersUpdated: (viewers: QueueViewer[]) => void;
    resize: (layout: DatabaseSchema["layout"]) => void;
    $ctrl: any;
}

const page: AngularJsPage = {
    id: "dennisontheinternet:viewer-queues",
    type: "angularjs",
    template,
    name: "Viewer Queues",
    icon: "fa-users",
    fullPage: true,
    disableScroll: true,
    controller: async ($scope: Scope, viewerQueuesService: ViewerQueuesService, vqBackend: VqBackendService, utilityService: any) => {
        const $ctrl = $scope.$ctrl;
        $scope.vqs = viewerQueuesService;
        $scope.layout = await vqBackend.send("getLayout");
        $scope.queueHeaders = [
            {
                name: "NAME",
                icon: "fa-tag",
                headerStyles: {
                    'min-width': '100px'
                },
                dataField: "name",
                sortable: false,
                cellTemplate: `{{data.name}}`,
                cellController: () => { }
            },
            {
                name: "TYPE",
                icon: "fa-bring-forward",
                headerStyles: {},
                sortable: false,
                cellTemplate: `{{data.type}}`,
                cellController: ($scope: any) => {
                    $scope.getTypeName = () => { /* {{String(data.type).charAt(0).toUpperCase() + String(data.type).slice(1)}} */ }
                }
            },
            {
                name: "VIEWERS",
                icon: "fa-users",
                cellStyles: {
                    'text-align': 'center'
                },
                sortable: false,
                cellTemplate: `<span ng-bind="data.viewers.length"></span>`,
                cellController: () => { }
            },
            {
                sortable: false,
                cellStyles: {
                    'text-align': 'center'
                },
                cellTemplate: `<input type="radio" ng-model="vqs.selectedQueueId" ng-value="data.id" />`,
                cellController: ($scope: any, viewerQueuesService: ViewerQueuesService) => {
                    $scope.vqs = viewerQueuesService;
                }
            }
        ];

        $scope.queueOptions = (queue: ViewerQueue) => {
            const options: MenuOption<ViewerQueue>[] = [
                {
                    html: `<a href><i class="fas fa-edit" style="margin-right: 10px;"></i> Edit</a>`,
                    click: () => {
                        viewerQueuesService.addOrEditQueue(queue);
                    }
                },
                {
                    html: `<a href><i class="fas fa-trash" style="margin-right: 10px;"></i> Delete</a>`,
                    click: () => {
                        // Show confirmation modal
                        viewerQueuesService.deleteQueue(queue.id);
                    }
                },
            ]
            if (queue.viewers.length > 0) {
                options.push({
                    text: "Pick Viewer(s)",
                    children: [
                        {
                            html: `<a href><i class="fas fa-users" style="margin-right: 10px;"></i> Pick Single Viewer</a>`,
                            click: () => {
                                viewerQueuesService.rollViewers(queue.id, 1);
                            }
                        },
                        {
                            html: `<a href><i class="fas fa-users" style="margin-right: 10px;"></i> Pick Multiple Viewers</a>`,
                            click: () => {
                                utilityService.showModal({
                                    component: "vqSliderModal",
                                    size: "sm",
                                    resolveObj: {
                                        label: "Viewer Count",
                                        sliderOptions: {
                                            min: 1,
                                            max: viewerQueuesService.queues[queue.id].viewers.length,
                                            step: 1,
                                            value: 1
                                        }
                                    },
                                    closeCallback: (resp: number) => {
                                        if (resp) {
                                            viewerQueuesService.rollViewers(queue.id, resp);
                                        }
                                    }
                                });
                            }
                        }
                    ]
                })
            }

            return options;
        };

        $scope.orderedViewerHeaders = [
            {
                name: "POSITION",
                show: ($scope: any) => {
                    return ($scope.$parent.$parent.queue || $scope.$parent.$parent.$parent.queue).type !== "random";
                },
                cellStyles: {
                    'text-align': 'center'
                },
                headerStyles: {
                    width: '50px'
                },
                cellTemplate: `{{$parent.$parent.$parent.$index + 1}}`,
                cellController: () => { }
            },
            {
                headerStyles: {
                    'width': '50px'
                },
                cellTemplate: `<img ng-src="{{data.avatarUrl || '../images/placeholders/default-profile-pic.png'}}"  style="width: 25px;height: 25px;border-radius: 25px;"/>`
            },
            {
                name: "USERNAME",
                    icon: "fa-user",
                    dataField: "username",
                    headerStyles: {
                        'min-width': '125px'
                    },
                    sortable: true,
                    cellTemplate: `{{data.displayName || data.username}}<span ng-if="data.displayName && data.username.toLowerCase() !== data.displayName.toLowerCase()" class="muted"> ({{data.username}})</span>`,
                    cellController: () => {}
            }
        ];

        $scope.viewerOptions = (viewer: QueueViewer) => {
            return [
                {
                    html: `<a href><i class="fas fa-trash" style="margin-right: 10px;"></i> Remove Viewer</a>`,
                    click: () => {
                        $scope.vqs.removeViewerFromQueue($scope.vqs.selectedQueueId, viewer.id);
                    }
                },
            ]
        }
    }
};

export default page;