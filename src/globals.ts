import { RunRequest } from "@crowbartools/firebot-custom-scripts-types";

export type Params = {};

class FrontendCommunicatorShim {
    private _runRequest: RunRequest<Params>;

    constructor(runRequest: RunRequest<Params>) {
        this._runRequest = runRequest;
    }

    on<TRequest extends keyof BackendCommunicatorCommands>(request: TRequest, callback: (...args: BackendCommunicatorCommands[TRequest]["args"]) => Promise<BackendCommunicatorCommands[TRequest]["returns"]>) {
        this._runRequest.modules.frontendCommunicator.onAsync(`dennisontheinternet:viewer-queues:${request}`, async (args: BackendCommunicatorCommands[TRequest]["args"]) => callback(...args));
    }

    async send<TRequest extends keyof FrontendCommunicatorCommands>(request: TRequest, ...args: FrontendCommunicatorCommands[TRequest]["args"]) {
        return this._runRequest.modules.frontendCommunicator.fireEventAsync<FrontendCommunicatorCommands[TRequest]["returns"], FrontendCommunicatorCommands[TRequest]["args"]>(`dennisontheinternet:viewer-queues:${request}`, args);
    }
}

class PluginGlobals {
    private _runRequest: RunRequest<Params>;
    private _scriptDataDir: string;
    private _frontendCommunicator: FrontendCommunicatorShim;

    get runRequest() {
        return this._runRequest;
    }

    set runRequest(runRequest: RunRequest<Params>) {
        this._runRequest = runRequest;
        this._frontendCommunicator = new FrontendCommunicatorShim(runRequest);
    }

    get scriptDataDir() {
        return this._scriptDataDir;
    }

    set scriptDataDir(scriptDataDir: string) {
        this._scriptDataDir = scriptDataDir;
    }

    get frontendCommunicator() {
        return this._frontendCommunicator;
    }
}

export default new PluginGlobals;