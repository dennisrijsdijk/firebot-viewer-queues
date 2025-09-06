import { AngularJsComponent } from "@crowbartools/firebot-custom-scripts-types/types/modules/ui-extension-manager";
import template from "./index.html";

type Scope = ng.IScope & {
    $ctrl: any;
    sts: any;
    searchQuery: string;
}

const component: AngularJsComponent = {
    name: "vqItemTable",
    template,
    bindings: {
        items: "<",
        onItemsUpdate: "&",
        headers: "<",
        sortTagContext: "@?",
        orderable: "<",
        addNewButtonDisabled: "<?",
        addNewButtonText: "@",
        onAddNewClicked: "&",
        contextMenuOptions: "&",
        noDataMessage: "@",
        noneFoundMessage: "@",
        searchPlaceholder: "@",
        searchField: "@?",
        testButton: "<?",
        onTestButtonClicked: "&",
        statusField: "@?",
        startingSortField: "@?",
        sortInitiallyReversed: "<?",
        customFilterName: "@?",
        useFullTextSearch: "<?",
        toplevelId: "@?",
    },
    transclude: {
        footer: "?fbItemTableFooter",
        toolbar: "?fbItemTableToolbar"
    },
    controller: ($scope: Scope, sortTagsService: any, effectQueuesService: any) => {
        const $ctrl = $scope.$ctrl;

        $scope.sts = sortTagsService;

        $ctrl.order = {
            field: null,
            reverse: false
        };

        $ctrl.getFilterName = () => {
            return $ctrl.useFullTextSearch ? null : $ctrl.customFilterName;
        };

        $ctrl.showAdvancedOptionsButton = false;

        $ctrl.hasAdvancedOptionsApplied = () => {
            return $ctrl.useFullTextSearch;
        };

        $ctrl.$onInit = () => {
            if ($ctrl.items == null) {
                $ctrl.items = [];
            }

            $ctrl.order.field = $ctrl.startingSortField ?? null;
            $ctrl.order.reverse = !!$ctrl.sortInitiallyReversed;

            $ctrl.showStatusIndicator = $ctrl.statusField != null;
            $ctrl.headerClass = `${($ctrl.sortTagContext ?? crypto.randomUUID()).split(' ').join('-')}-header`;

            $ctrl.showAdvancedOptionsButton = $ctrl.customFilterName != null;
        };

        $ctrl.triggerItemsUpdate = () => {
            $ctrl.onItemsUpdate({ items: $ctrl.items });
        };

        $ctrl.getStatus = (item: any) => {
            if (item == null || $ctrl.statusField == null) {
                return false;
            }
            let status = item;
            const nodes = $ctrl.statusField.split(".");
            for (const node of nodes) {
                status = status[node];
            }
            return status;
        };

        $ctrl.sortableOptions = {
            handle: ".dragHandle",
            'ui-preserve-size': true,
            stop: (_e: any, ui: any) => {
                //reset the width of the children that "ui-preserve-size" sets
                // @ts-expect-error
                const item = angular.element(ui.item);
                // @ts-expect-error
                item.children().each(function () {
                    // @ts-expect-error
                    const $el = angular.element(this);
                    $el.css("width", "");
                });

                if (sortTagsService.getSelectedSortTag($ctrl.sortTagContext) != null &&
                    ($scope.searchQuery == null ||
                        $scope.searchQuery.length < 1)) {
                    return;
                }

                $ctrl.triggerItemsUpdate();
            }
        };

        $ctrl.addToEffectQueue = (item: any, queueId: any) => {
            if (item == null) {
                return;
            }

            if (item.effects) {
                item.effects.queue = queueId;
            }

            $ctrl.triggerItemsUpdate();
        };

        $ctrl.clearEffectQueue = (item: any) => {
            item.effects.queue = null;
        };

        $ctrl.getContextMenu = (item: any) => {
            const menuItems = [...($ctrl.contextMenuOptions({ item: item }) || [])];

            const queues = effectQueuesService.getEffectQueues();
            if (item.effects != null && queues != null && queues.length > 0) {
                const children = queues.map((q: any) => {
                    const isSelected = item.effects.queue && item.effects.queue === q.id;
                    return {
                        html: `<a href><i class="${isSelected ? 'fas fa-check' : ''}" style="margin-right: ${isSelected ? '10' : '27'}px;"></i> ${q.name}</a>`,
                        click: () => {
                            $ctrl.addToEffectQueue(item, q.id);
                        }
                    };
                });

                const hasEffectQueue = item.effects.queue != null && item.effects.queue !== "";
                children.push({
                    html: `<a href><i class="${!hasEffectQueue ? 'fas fa-check' : ''}" style="margin-right: ${!hasEffectQueue ? '10' : '27'}px;"></i> None</a>`,
                    click: () => {
                        $ctrl.clearEffectQueue(item);
                    },
                    hasTopDivider: true
                });

                menuItems.push({
                    text: `Effect Queues...`,
                    children: children,
                    hasTopDivider: true
                });
            }

            return menuItems;
        };

        $ctrl.isOrderField = function (field: any) {
            return field === $ctrl.order.field;
        };

        $ctrl.setOrderField = function (field: any) {
            if ($ctrl.order.field !== field) {
                $ctrl.order.reverse = false;
                $ctrl.order.field = field;
            } else if (!$ctrl.order.reverse) {
                $ctrl.order.reverse = true;
            } else {
                $ctrl.order.field = null;
                $ctrl.order.reverse = false;
            }
        };

        $ctrl.dynamicOrder = function (data: any) {
            const field = $ctrl.order.field;

            if (field == null) {
                return null;
            }

            if (field === '%sorttags%') {
                return sortTagsService
                    .getSortTagsForItem($ctrl.sortTagContext, data.sortTags)
                    .map((st: any) => st.name)
                    .join(", ");
            }

            if (field.includes(".")) {
                const nodes = field.split(".");
                let currentData = data;
                for (const node of nodes) {
                    currentData = currentData[node];
                }
                return currentData;
            }

            return data[$ctrl.order.field];
        };
    }
};

export default component;