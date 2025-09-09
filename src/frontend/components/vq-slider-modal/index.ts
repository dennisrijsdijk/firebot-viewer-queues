import { AngularJsComponent } from "@crowbartools/firebot-custom-scripts-types/types/modules/ui-extension-manager";
import template from "./index.html";

type Scope = ng.IScope & {
    $ctrl: any;
}

const component: AngularJsComponent = {
    name: "vqSliderModal",
    template,
    bindings: {
        resolve: "<",
        close: "&",
        dismiss: "&",
        modalInstance: "<"
    },
    controller: ($scope: Scope) => {
        const $ctrl = $scope.$ctrl;

        $ctrl.$onInit = () => {
            if ($ctrl.resolve.label == null) {
                throw new Error("vq-slider-modal: label is required");
            }
            if ($ctrl.resolve.sliderOptions == null) {
                throw new Error("vq-slider-modal: sliderOptions is required");
            }

            $ctrl.label = $ctrl.resolve.label;
            $ctrl.sliderOptions = $ctrl.resolve.sliderOptions;
            $ctrl.sliderValue = 1;
        };

        $ctrl.pick = () => {
            $ctrl.close({
                $value: $ctrl.sliderValue
            });
        }
    }
};

export default component;