import { AngularJsFilter } from "@crowbartools/firebot-custom-scripts-types/types/modules/ui-extension-manager";

const filter: AngularJsFilter = {
    name: "maybeReverse",
    function: () => {
        return (items: any[], reverse: boolean = false) => {
            if (!reverse || !items || !Array.isArray(items)) {
                return items;
            }
            return [...items].reverse();
        };
    }
};

export default filter;