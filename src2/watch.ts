import * as chokidar from "chokidar";

export interface Group {
    add?: string[];
    change?: string[];
    unlink?: string[];
}
export type Listener = (group: Group) => void;

interface Options {
    glob: string | string[];
    listener: Listener;
    delay?: number;
    normalize?: (str: string) => string;
}

export function createWatch({ glob, listener, delay, normalize }: Options) {
    /**
     * @type {event}
     */
    let currentGroup: Group;

    const loadGroup = () => {
        if (!currentGroup) {
            currentGroup = {};
            setTimeout(() => {
                listener(currentGroup);
                currentGroup = null;
            }, delay || 200);
        }
    };

    const watcher = chokidar.watch(glob, { ignoreInitial: true });

    ["add", "change", "unlink"].map((type: keyof Group) => {
        watcher.on(type, (file) => {
            loadGroup();
            currentGroup[type] = currentGroup[type] || [];
            file = normalize ? normalize(file) : file;
            if (!currentGroup[type].includes(file)) {
                currentGroup[type].push(file);
            }
        });
    });

    return watcher;
}
