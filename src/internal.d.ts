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
export type getCache = (index: string | Symbol) => Store;

/**
 * stores all concurrent files in compilation,
 */
export interface inputs extends Store {}

/**
 * read a file and cache this reading in the context of the build
 * This chache can only be cleared by `build.deleteInput` or the createWatch
 * instance associated with the build.
 */
export type readFile = (file: string) => Promise<string>;

/**
 * check if the file has already been processed
 */
export type isPreventLoad = (file: string) => boolean;

/**
 * check if the file has not already been processed
 */
export type isNotPreventLoad = (file: string) => boolean;

/**
 * Generate a request that is cached globally
 */

export type request = (url: string) => Promise<[string, any]>;

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
 * Determines if it is a file that is copied
 */
export type isForCopy = (file: string) => boolean;

/**
 * get the destination name of the file
 */
export type getDestDataFile = (
    file: string
) => {
    base: string;
    name: string;
    link: string;
    dest: string;
    raw: { file: string; dir: string; base: string };
};

/**
 *
 */
export interface logger {
    /**
     * Force log printing by closing build
     */
    markBuildError: (message: any, mark: string) => Promise<any>;
    markBuild: (mark: string) => Promise<any>;
    debug: (message: string, mark: string) => Promise<any>;
    mark: (mark: string) => Promise<any>;
}

export interface options {
    src: string | string[];
    pkg?: object;
    dest?: string;
    mode?: string;
    config?: any;
    watch?: boolean;
    external?: string[] | string;
    jsx?: string;
    jsxFragment?: string;
    forceWrite?: boolean;
    silent?: boolean;
    href?: string;
    proxy?: string;
    server?: boolean | string;
    virtual?: boolean;
    sourcemap?: boolean;
    minify?: boolean;
    hashAllAssets?: boolean;
    assetDir?: string;
    assetHashPattern?: string;
    assetsWithoutHash?: RegExp;
    assetsDir?: string;
    port?: number;
}

export interface build {
    request: request;
    inputs: inputs;
    options: options;
    getCache: getCache;
    readFile: readFile;
    getDestDataFile: getDestDataFile;
    isPreventLoad: isPreventLoad;
    isNotPreventLoad: isNotPreventLoad;
    deleteInput: deleteInput;
    preventNextLoad: preventNextLoad;
    mountFile: mountFile;
    fileWatcher: fileWatcher;
    isForCopy: isForCopy;
    logger: logger;
    addRootAsset?: (file: string) => Promise<string>;
}

interface Store {
    [index: string]: any;
}

/**
 * reload the browser if it is in livereload mode
 */
type reload = () => void;

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
