import { AngularJsFactory } from "@crowbartools/firebot-custom-scripts-types/types/modules/ui-extension-manager";

export type VqBackendService = {
    on<T extends keyof FrontendCommunicatorCommands>(request: T, callback: (...args: FrontendCommunicatorCommands[T]["args"]) => Promise<FrontendCommunicatorCommands[T]["returns"]>): void;
    send<T extends keyof BackendCommunicatorCommands>(request: T, ...args: BackendCommunicatorCommands[T]["args"]): Promise<BackendCommunicatorCommands[T]["returns"]>;
}

const factory: AngularJsFactory = {
    name: "vqBackend",
    function: (backendCommunicator: any) => {
        const service: VqBackendService = {
            on: <T extends keyof FrontendCommunicatorCommands>(request: T, callback: (...args: FrontendCommunicatorCommands[T]["args"]) => Promise<FrontendCommunicatorCommands[T]["returns"]>): void => {
                backendCommunicator.onAsync(`dennisontheinternet:viewer-queues:${request}`, (args: FrontendCommunicatorCommands[T]["args"]) => callback(...args));
            },
            send: async (request, ...args) => {
                return await backendCommunicator.fireEventAsync(`dennisontheinternet:viewer-queues:${request}`, args);
            }
        };

        return service;
    }
};

export default factory;