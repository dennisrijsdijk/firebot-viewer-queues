import { CommandDefinition, SubCommand, SystemCommand } from "@crowbartools/firebot-custom-scripts-types/types/modules/command-manager";
import globals from "../globals";

type CommandOptionBase = {
    type: "string" | "number" | "boolean" | "enum";
    title: string;
    default: unknown;
    description?: string;
    value?: unknown;
}

type CommandStringOption = CommandOptionBase & {
    type: "string";
    default: string;
    tip?: string;
    useTextArea?: boolean;
    value?: string;
};

type CommandNumberOption = CommandOptionBase & {
    type: "number";
    default: number;
    value?: number;
};

type CommandBooleanOption = CommandOptionBase & {
    type: "boolean";
    default: boolean;
    value?: boolean;
};

type CommandEnumOption = CommandOptionBase & {
    type: "enum";
    options: string[];
    default: string;
    value?: string;
};

type ViewerQueueCommandOptions = {
    options: {
        baseCommandNotJoinedTemplate: CommandStringOption;
        baseCommandJoinedRandomTemplate: CommandStringOption;
        baseCommandJoinedTemplate: CommandStringOption;

        joinCommandAlreadyJoinedTemplate: CommandStringOption;
        joinCommandAlreadyJoinedRandomTemplate: CommandStringOption;
        joinCommandClosedTemplate: CommandStringOption;
        joinCommandJoinedTemplate: CommandStringOption;
        joinCommandJoinedRandomTemplate: CommandStringOption;

        positionCommandNotJoinedTemplate: CommandStringOption;
        positionCommandIsRandomTemplate: CommandStringOption;
        positionCommandPositionTemplate: CommandStringOption;

        leaveCommandNotJoinedTemplate: CommandStringOption;
        leaveCommandLeftTemplate: CommandStringOption;

        clearCommandClearedTemplate: CommandStringOption;

        pickCommandPickedTemplate: CommandStringOption;
        pickCommandNoViewersTemplate: CommandStringOption;
        pickCommandAutoSplitMessage: CommandBooleanOption;
        pickCommandAutoSplitCount: CommandNumberOption;

        openCommandOpenedTemplate: CommandStringOption;
        openCommandAlreadyOpenTemplate: CommandStringOption;

        closeCommandClosedTemplate: CommandStringOption;
        closeCommandAlreadyClosedTemplate: CommandStringOption;
    }
}

type VqCommandDefinition = {
    definition: {
        viewerQueueId: string;
    }
}

type CommandType = SystemCommand<ViewerQueueCommandOptions & CommandDefinition> & VqCommandDefinition;

function replaceAndSendChatMessage(template: string, variables: Record<string, string | number | boolean>) {
    let message = template;

    if (!message || message.trim().length === 0) {
        return;
    }

    Object.entries(variables).forEach(([key, value]) => {
        message = message.replaceAll(`{${key}}`, String(value));
    });

    // Send the chat message
    return globals.runRequest.modules.twitchChat.sendChatMessage(message, null, "bot");
}

function normalizeUsername(username: string, displayName: string): string {
    if (username.toLowerCase() === displayName.toLowerCase()) {
        return displayName;
    }
    return `${displayName} (${username})`;
}

const modRestriction = {
    restrictionData: {
        restrictions: [
            {
                id: "sys-cmd-mods-only-perms",
                type: "firebot:permissions",
                mode: "roles",
                roleIds: [
                    "mod",
                    "broadcaster"
                ]
            }
        ]
    }
};

const subCommands = [
    {
        arg: "join",
        usage: "join",
        description: "Join the queue if it is open."
    },
    {
        arg: "position",
        usage: "position",
        description: "View your position in the queue if you are in it."
    },
    {
        arg: "leave",
        usage: "leave",
        description: "Leave the queue if you are in it."
    },
    {
        arg: "clear",
        usage: "clear",
        description: "Clear all viewers from the queue."
    },
    {
        arg: "pick",
        usage: "pick <count>",
        description: "Pick one or more viewers from the queue. Defaults to 1 if no count is provided.",
        ...modRestriction
    },
    {
        arg: "open",
        usage: "open",
        description: "Open the queue to allow viewers to join.",
        ...modRestriction
    },
    {
        arg: "close",
        usage: "close",
        description: "Close the queue to prevent viewers from joining.",
        ...modRestriction
    }
] as unknown as SubCommand[];

export class VqCommandManager {
    createCommandDefinition(queue: ViewerQueue): CommandType {
        const cleanName = queue.name.replace(/\s+/g, "-").toLowerCase();

        const command: CommandType = {
            definition: {
                id: `dennisontheinternet:viewer-queues:${queue.id}`,
                name: `${queue.name} Management`,
                active: true,
                trigger: `!${cleanName}`,
                description: `Allows management of the "${queue.name}" Viewer Queue`,
                autoDeleteTrigger: false,
                scanWholeMessage: false,
                cooldown: {
                    user: 0,
                    global: 0
                },
                viewerQueueId: queue.id,
                baseCommandDescription: "View information about the queue",
                options: {
                    baseCommandNotJoinedTemplate: {
                        type: "string",
                        title: "Main Command Template (Not Joined)",
                        description: "How the queue command should respond when the user is not in the queue, and the queue is not random.",
                        tip: "Variables: {username}, {queueName}, {queueLength}, {queueStatus}",
                        default: "The queue is currently {queueStatus} and there are {queueLength} people in the queue.",
                        useTextArea: true,
                    },
                    baseCommandJoinedRandomTemplate: {
                        type: "string",
                        title: "Main Command Template (Joined, Random Queue)",
                        description: "How the queue command should respond when the user is in the queue, and the queue is random.",
                        tip: "Variables: {username}, {queueName}, {queueLength}, {queueStatus}",
                        default: "The queue is currently {queueStatus} and there are {queueLength} people in the queue, including you.",
                        useTextArea: true,
                    },
                    baseCommandJoinedTemplate: {
                        type: "string",
                        title: "Main Command Template (Joined, Non-Random Queue)",
                        description: "How the queue command should respond when the user is in the queue, and the queue is not random.",
                        tip: "Variables: {username}, {queueName}, {queuePosition}, {queuePeopleAhead}, {queueLength}, {queueStatus}",
                        default: "The queue is currently {queueStatus} and you are #{queuePosition}/{queueLength} in the queue.",
                        useTextArea: true,
                    },

                    joinCommandAlreadyJoinedTemplate: {
                        type: "string",
                        title: "Join Command Template (Already Joined)",
                        description: "How the join subcommand should respond when the user is already in the queue.",
                        tip: "Variables: {username}, {queueName}, {queuePosition}, {queuePeopleAhead}, {queueLength}",
                        default: "You are already in the queue, {username}! You are currently #{queuePosition}/{queueLength}.",
                        useTextArea: true,
                    },
                    joinCommandAlreadyJoinedRandomTemplate: {
                        type: "string",
                        title: "Join Command Template (Already Joined, Random Queue)",
                        description: "How the join subcommand should respond when the user is already in the queue, and the queue is random.",
                        tip: "Variables: {username}, {queueName}, {queueLength}",
                        default: "You are already in the queue, {username}!",
                        useTextArea: true
                    },
                    joinCommandClosedTemplate: {
                        type: "string",
                        title: "Join Command Template (Queue Closed)",
                        description: "How the join subcommand should respond when the queue is closed.",
                        tip: "Variables: {username}, {queueName}",
                        default: "Sorry {username}, the queue is currently closed.",
                        useTextArea: true,
                    },
                    joinCommandJoinedTemplate: {
                        type: "string",
                        title: "Join Command Template (Joined, Non-Random Queue)",
                        description: "How the join subcommand should respond when the user successfully joins the queue, and the queue is not random.",
                        tip: "Variables: {username}, {queueName}, {queuePosition}, {queuePeopleAhead}, {queueLength}",
                        default: "You have joined the queue, {username}! You are currently #{queuePosition}/{queueLength}.",
                        useTextArea: true,
                    },
                    joinCommandJoinedRandomTemplate: {
                        type: "string",
                        title: "Join Command Template (Joined, Random Queue)",
                        description: "How the join subcommand should respond when the user successfully joins the queue, and the queue is random.",
                        tip: "Variables: {username}, {queueName}, {queueLength}",
                        default: "You have joined the queue, {username}! There are currently {queueLength} people in the queue.",
                        useTextArea: true,
                    },

                    positionCommandNotJoinedTemplate: {
                        type: "string",
                        title: "Position Command Template (Not Joined)",
                        description: "How the position subcommand should respond when the user is not in the queue.",
                        tip: "Variables: {username}, {queueName}, {queueLength}, {queueStatus}",
                        default: "You are not currently in the queue, {username}.",
                        useTextArea: true,
                    },
                    positionCommandPositionTemplate: {
                        type: "string",
                        title: "Position Command Template (Position)",
                        description: "How the position subcommand should respond when reporting the user's position in the queue.",
                        tip: "Variables: {username}, {queueName}, {queuePosition}, {queuePeopleAhead}, {queueLength}, {queueStatus}",
                        default: "Your position in the queue is #{queuePosition}/{queueLength}, {username}.",
                        useTextArea: true,
                    },
                    positionCommandIsRandomTemplate: {
                        type: "string",
                        title: "Position Command Template (Random Queue)",
                        description: "How the position subcommand should respond when the queue is random.",
                        tip: "Variables: {username}, {queueName}, {queueLength}, {queueStatus}",
                        default: "You are currently in the queue, {username}.",
                        useTextArea: true,
                    },

                    leaveCommandNotJoinedTemplate: {
                        type: "string",
                        title: "Leave Command Template (Not Joined)",
                        description: "How the leave subcommand should respond when the user is not in the queue.",
                        tip: "Variables: {username}, {queueName}",
                        default: "You are not currently in the queue, {username}.",
                        useTextArea: true,
                    },
                    leaveCommandLeftTemplate: {
                        type: "string",
                        title: "Leave Command Template (Left)",
                        description: "How the leave subcommand should respond when the user successfully leaves the queue.",
                        tip: "Variables: {username}, {queueName}, {queueLength}",
                        default: "You have successfully left the queue, {username}.",
                        useTextArea: true,
                    },

                    clearCommandClearedTemplate: {
                        type: "string",
                        title: "Clear Command Template",
                        description: "How the clear subcommand should respond when the queue is cleared.",
                        tip: "Variables: {queueName}",
                        default: "The queue has been cleared.",
                        useTextArea: true,
                    },

                    pickCommandPickedTemplate: {
                        type: "string",
                        title: "Pick Command Template",
                        description: "How the pick subcommand should respond when a viewer is picked from the queue.",
                        tip: "Variables: {users}, {queueName}, {queueLength}",
                        default: "{users}, you're up next! There are {queueLength} people remaining in the queue.",
                        useTextArea: true
                    },
                    pickCommandNoViewersTemplate: {
                        type: "string",
                        title: "Pick Command Template (No Viewers)",
                        description: "How the pick subcommand should respond when there are no viewers in the queue.",
                        tip: "Variables: {queueName}",
                        default: "There is nobody in the queue to pick from.",
                        useTextArea: true
                    },
                    pickCommandAutoSplitMessage: {
                        type: "boolean",
                        title: "Pick Command - Auto Split Message",
                        description: "If picking multiple viewers, automatically split them into multiple messages.",
                        default: true,
                    },
                    pickCommandAutoSplitCount: {
                        type: "number",
                        title: "Pick Command - Auto Split Count",
                        description: "If picking multiple viewers, how many viewers to put in each message.",
                        default: 3,
                    },

                    openCommandOpenedTemplate: {
                        type: "string",
                        title: "Open Command Template (Opened)",
                        description: "How the open subcommand should respond when the queue is opened.",
                        tip: "Variables: {queueName}",
                        default: "The queue is now open!",
                        useTextArea: true,
                    },
                    openCommandAlreadyOpenTemplate: {
                        type: "string",
                        title: "Open Command Template (Already Open)",
                        description: "How the open subcommand should respond when the queue is already open.",
                        tip: "Variables: {queueName}",
                        default: "The queue is already open.",
                        useTextArea: true,
                    },

                    closeCommandClosedTemplate: {
                        type: "string",
                        title: "Close Command Template (Closed)",
                        description: "How the close subcommand should respond when the queue is closed.",
                        tip: "Variables: {queueName}",
                        default: "The queue is now closed!",
                        useTextArea: true,
                    },
                    closeCommandAlreadyClosedTemplate: {
                        type: "string",
                        title: "Close Command Template (Already Closed)",
                        description: "How the close subcommand should respond when the queue is already closed.",
                        tip: "Variables: {queueName}",
                        default: "The queue is already closed.",
                        useTextArea: true,
                    },
                },
                subCommands
            },
            onTriggerEvent: async (event) => {
                const queue = await globals.database.getQueue((event.command as CommandDefinition & { viewerQueueId: string }).viewerQueueId);
                if (!queue) {
                    // Hell froze over
                    debugger;
                    return;
                }
                
                const commandSender = {
                    // @ts-expect-error
                    id: event.chatMessage.userId,
                    // @ts-expect-error
                    login: event.chatMessage.username,
                    // @ts-expect-error
                    display: event.chatMessage.userDisplayName,
                    // @ts-expect-error
                    avatarUrl: event.chatMessage.profilePicUrl
                }
                
                const viewerIndex = queue.viewers.findIndex(v => v.id === commandSender.id);

                if (!event.userCommand.triggeredSubcmd) {
                    if (viewerIndex === -1) {
                        replaceAndSendChatMessage(event.commandOptions.baseCommandNotJoinedTemplate as string, {
                            username: normalizeUsername(commandSender.login, commandSender.display),
                            queueName: queue.name,
                            queueLength: queue.viewers.length,
                            queueStatus: queue.open ? "Open" : "Closed"
                        });
                        return;
                    }
                    if (queue.type === "random") {
                        replaceAndSendChatMessage(event.commandOptions.baseCommandJoinedRandomTemplate as string, {
                            username: normalizeUsername(commandSender.login, commandSender.display),
                            queueName: queue.name,
                            queueLength: queue.viewers.length,
                            queueStatus: queue.open ? "Open" : "Closed"
                        });
                        return;
                    }
                    
                    replaceAndSendChatMessage(event.commandOptions.baseCommandJoinedTemplate as string, {
                        username: normalizeUsername(commandSender.login, commandSender.display),
                        queueName: queue.name,
                        queuePosition: viewerIndex + 1,
                        queuePeopleAhead: viewerIndex,
                        queueLength: queue.viewers.length,
                        queueStatus: queue.open ? "Open" : "Closed"
                    });
                    return;
                }

                if (!event.userCommand.triggeredSubcmd.active) {
                    return;
                }

                switch (event.userCommand.triggeredArg) {
                    case "join":
                        if (viewerIndex === -1) {
                            if (!queue.open) {
                                replaceAndSendChatMessage(event.commandOptions.joinCommandNotOpenTemplate as string, {
                                    username: normalizeUsername(commandSender.login, commandSender.display),
                                    queueName: queue.name
                                });
                                break;
                            }
                            
                            await globals.database.addViewer(queue.id, {
                                id: commandSender.id,
                                username: commandSender.login,
                                displayName: commandSender.display,
                                avatarUrl: commandSender.avatarUrl // TODO: Fetch avatar URL
                            });

                            if (queue.type === "random") {
                                replaceAndSendChatMessage(event.commandOptions.joinCommandJoinedRandomTemplate as string, {
                                    username: normalizeUsername(commandSender.login, commandSender.display),
                                    queueName: queue.name,
                                    queueLength: queue.viewers.length
                                });
                                break;
                            }

                            replaceAndSendChatMessage(event.commandOptions.joinCommandJoinedTemplate as string, {
                                username: normalizeUsername(commandSender.login, commandSender.display),
                                queueName: queue.name,
                                queuePosition: queue.viewers.length,
                                queuePeopleAhead: queue.viewers.length - 1,
                                queueLength: queue.viewers.length
                            });
                            break;
                        }

                        if (queue.type === "random") {
                            replaceAndSendChatMessage(event.commandOptions.joinCommandAlreadyJoinedRandomTemplate as string, {
                                username: normalizeUsername(commandSender.login, commandSender.display),
                                queueName: queue.name,
                                queueLength: queue.viewers.length
                            });
                            break;
                        }

                        replaceAndSendChatMessage(event.commandOptions.joinCommandAlreadyJoinedTemplate as string, {
                            username: normalizeUsername(commandSender.login, commandSender.display),
                            queueName: queue.name,
                            queuePosition: viewerIndex + 1,
                            queuePeopleAhead: viewerIndex,
                            queueLength: queue.viewers.length
                        });
                        break;
                    case "position":
                        if (viewerIndex === -1) {
                            replaceAndSendChatMessage(event.commandOptions.positionCommandNotJoinedTemplate as string, {
                                username: normalizeUsername(commandSender.login, commandSender.display),
                                queueName: queue.name,
                                queueLength: queue.viewers.length,
                                queueStatus: queue.open ? "Open" : "Closed"
                            });
                            break;
                        }
                        if (queue.type === "random") {
                            replaceAndSendChatMessage(event.commandOptions.positionCommandIsRandomTemplate as string, {
                                username: normalizeUsername(commandSender.login, commandSender.display),
                                queueName: queue.name,
                                queueLength: queue.viewers.length,
                                queueStatus: queue.open ? "Open" : "Closed"
                            });
                            break;
                        }
                        
                        replaceAndSendChatMessage(event.commandOptions.positionCommandPositionTemplate as string, {
                            username: normalizeUsername(commandSender.login, commandSender.display),
                            queueName: queue.name,
                            queuePosition: viewerIndex + 1,
                            queuePeopleAhead: viewerIndex,
                            queueLength: queue.viewers.length,
                            queueStatus: queue.open ? "Open" : "Closed"
                        });
                        break;
                    case "leave":
                        if (viewerIndex === -1) {
                            replaceAndSendChatMessage(event.commandOptions.leaveCommandNotJoinedTemplate as string, {
                                username: normalizeUsername(commandSender.login, commandSender.display),
                                queueName: queue.name
                            });
                            break;
                        }

                        await globals.database.removeViewer(queue.id, commandSender.id);

                        replaceAndSendChatMessage(event.commandOptions.leaveCommandLeftTemplate as string, {
                            username: normalizeUsername(commandSender.login, commandSender.display),
                            queueName: queue.name,
                            queueLength: queue.viewers.length
                        });
                        break;
                    case "clear":
                        await globals.database.clearQueue(queue.id);

                        replaceAndSendChatMessage(event.commandOptions.clearCommandClearedTemplate as string, {
                            queueName: queue.name
                        });
                        break;
                    case "pick":
                        if (queue.viewers.length === 0) {
                            replaceAndSendChatMessage(event.commandOptions.pickCommandNoViewersTemplate as string, {
                                queueName: queue.name
                            });
                            break;
                        }

                        const count = parseInt(event.userCommand.args[1] || "1");

                        if (!event.commandOptions.pickCommandAutoSplitMessage as boolean) {
                            const viewers = await globals.database.rollViewers(queue.id, count) || [];
                            replaceAndSendChatMessage(event.commandOptions.pickCommandPickedTemplate as string, {
                                users: viewers.map(v => normalizeUsername(v.username, v.displayName)).join(", "),
                                queueName: queue.name,
                                queueLength: queue.viewers.length
                            });
                            break;
                        }

                        let pickedViewerCount = 0;
                        do {
                            const amountToPick = Math.min(event.commandOptions.pickCommandAutoSplitCount as number, count - pickedViewerCount);
                            const viewers = await globals.database.rollViewers(queue.id, amountToPick) || [];
                            replaceAndSendChatMessage(event.commandOptions.pickCommandPickedTemplate as string, {
                                users: viewers.map(v => normalizeUsername(v.username, v.displayName)).join(", "),
                                queueName: queue.name,
                                queueLength: queue.viewers.length
                            });
                            pickedViewerCount += amountToPick;
                        } while (pickedViewerCount < count && queue.viewers.length > 0)
                        break;
                    case "open":
                        if (queue.open) {
                            replaceAndSendChatMessage(event.commandOptions.openCommandAlreadyOpenTemplate as string, {
                                queueName: queue.name
                            });
                            break;
                        }

                        await globals.database.toggleQueue(queue.id);

                        replaceAndSendChatMessage(event.commandOptions.openCommandOpenedTemplate as string, {
                            queueName: queue.name
                        });
                        break;
                    case "close":
                        if (!queue.open) {
                            replaceAndSendChatMessage(event.commandOptions.closeCommandAlreadyClosedTemplate as string, {
                                queueName: queue.name
                            });
                            break;
                        }

                        await globals.database.toggleQueue(queue.id);

                        replaceAndSendChatMessage(event.commandOptions.closeCommandClosedTemplate as string, {
                            queueName: queue.name
                        });
                        break;
                    default:
                        // Unknown subcommand?
                        return;
                }
            }
        };

        return command;
    }

    updateQueueCommand(action: "add" | "update" | "remove", queue: ViewerQueue) {
        const commandManager = globals.runRequest.modules.commandManager;
        if (!queue) {
            return;
        }

        switch (action) {
            case "add": {
                const command = this.createCommandDefinition(queue);
                commandManager.registerSystemCommand(command);
                break;
            }
            case "update": {
                commandManager.unregisterSystemCommand(`dennisontheinternet:viewer-queues:${queue.id}`);
                const command = this.createCommandDefinition(queue);
                commandManager.registerSystemCommand(command);
                break;
            }
            case "remove": {
                commandManager.unregisterSystemCommand(`dennisontheinternet:viewer-queues:${queue.id}`);
                break;
            }
        }
    }

    constructor() {
        Object.values(globals.database.getQueues()).forEach(queue => this.updateQueueCommand("add", queue));
        
        globals.database.on("queueAdded", (queue) => this.updateQueueCommand("add", queue));
        globals.database.on("queueUpdated", (queue) => this.updateQueueCommand("update", queue));
        globals.database.on("queueRemoved", (queue) => this.updateQueueCommand("remove", queue));
    }
}