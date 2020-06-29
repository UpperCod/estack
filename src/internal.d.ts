namespace Build {
    interface MountFile {
        dest: string;
        code?: string;
        /**
         * Type of the file to write, this is used as a mime for the server
         */
        type?: string;
        /**
         * url of origin of the file to send as a stream to the server
         */
        stream?: string;
    }

    /**
     * Create a cache as reference and associate it with the build
     */
    export type getCache = (index: string | Symbol) => Internal.Store;

    /**
     * stores all concurrent files in compilation,
     */
    export interface inputs extends Internal.Store {}

    /**
     * read a file and cache this reading in the context of the build
     * This chache can only be cleared by `build.deleteInput` or the createWatch
     * instance associated with the build.
     */
    export type readFile = (file: string) => Promise<string>;

    /**
     * Returns the name of the file in the destination directory defined in `options.dest`
     */
    export type getDest = (file: string, folder?: string) => string;

    /**
     * returns the file permalink by concatenating `options.href`
     */
    export type getLink = (file: string) => string;

    /**
     * check if the file has already been processed
     */
    export type isPreventLoad = (file: string) => boolean;

    /**
     * check if the file has not already been processed
     */
    export type isNotPreventLoad = (file: string) => boolean;

    /**
     * Add a `file` like to the watcher and associate it to the `parentFile` for rebuilding
     */
    export type fileWatcher = (
        file: string,
        parentFile: string,
        rebuild?: boolean
    ) => void;

    /**
     * If the file is not registered allows its use in the opposite case prevents its use
     */
    export type preventNextLoad = (file: string) => boolean;

    /**
     * Virtual write or mount the file in the server cache when `options.virtual` is `true`
     */
    export type mountFile = (options: MountFile) => Promise<any>;

    /**
     * Delete a file from the cache
     */
    export type deleteInput = (file: string) => string;

    /**
     * get the destination name of the file
     */
    export type getFileName = (file: string) => string;

    /**
     *
     */
    export interface logger {
        /**
         * Force log printing by closing build
         */
        markBuildError: (message: string, mark: string) => Promise<any>;
        markBuild: (mark: string) => Promise<any>;
        debug: (message: string, mark: string) => Promise<any>;
        mark: (mark: string) => Promise<any>;
    }

    export interface options {
        src: string | string[];
        dest: string;
        config?: any;
        external?: string[] | string;
        jsx?: string;
        jsxFragment?: string;
        forceWrite?: boolean;
        silent?: boolean;
        href?: string;
        server?: boolean;
        virtual?: boolean;
        [ignore: string]: any;
    }

    export interface build {
        inputs: inputs;
        options: options;
        getCache: getCache;
        readFile: readFile;
        getLink: getLink;
        getDest: getDest;
        isPreventLoad: isPreventLoad;
        isNotPreventLoad: isNotPreventLoad;
        deleteInput: deleteInput;
        getFileName: getFileName;
        preventNextLoad: preventNextLoad;
        mountFile: mountFile;
        footerLog: footerLog;
        fileWatcher: fileWatcher;
        logger: logger;
        addRootAsset?: (file: string) => Promise<string>;
    }
}

namespace Internal {
    export interface Store {
        [index: string | Symbol]: any;
    }
    /**
     * reload the browser if it is in livereload mode
     */
    export type reload = () => void;

    export interface server {
        /**
         * If the server is in liverereload mode it dispatches the page reload
         */
        reload: reload;

        /**
         *  port occupied by the server
         */
        port: number;

        sources: Store;
    }
}
