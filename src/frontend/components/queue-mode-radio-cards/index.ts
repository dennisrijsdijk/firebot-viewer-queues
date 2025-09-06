import { AngularJsComponent } from "@crowbartools/firebot-custom-scripts-types/types/modules/ui-extension-manager";
import template from "./index.html";

type Scope = ng.IScope & {
    $ctrl: any;
    id: string;
    setQueueMode: (mode: ViewerQueue["type"]) => void;
}

const component: AngularJsComponent = {
    name: "queueModeRadioCards",
    template,
    bindings: {
        modelValue: "=ngModel",
        id: "@?"
    },
    controller: ($scope: Scope) => {
        const $ctrl = $scope.$ctrl;
        $scope.setQueueMode = function (value) {
            $ctrl.modelValue = value;
        }
    }
};

export default component;