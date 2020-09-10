declare module "@estack" {
    export interface OptionsDest {
        assetHashPattern: string;
        assetsWithoutHash: RegExp;
        assetsDir: string;
        dest: string;
        href: string;
    }

    export interface LogBody {
        src: string;
        items: string[];
    }

    export interface LogOptions {
        message: string;
        body?: LogBody[];
        type?: string;
        params?: string[];
    }

    export interface Log {
        print: (options: LogOptions) => void;
    }

    export interface Options extends Omit<OptionsDest, "assetsWithoutHash"> {
        mode: string;
        src: string | string[];
        js?: string;
        css?: string;
        silent?: boolean;
        minify?: boolean;
        port?: number;
        sourcemap?: boolean;
        watch?: boolean;
    }

    export interface OptionsBuild extends OptionsDest {
        mode: string;
        src: string[];
        site: boolean;
        destAssets: string;
        watch: boolean;
        external: string[];
        js?: any[];
        css?: any[];
        silent?: boolean;
        minify?: boolean;
        server?: boolean;
        port?: number;
        sourcemap: boolean;
    }

    export interface FillData<T = any> {
        [index: string]: T;
    }

    export interface Link extends FillData {
        link: string;
        linkTitle: string;
    }

    export interface FileOptions {
        root?: boolean;
        watch?: boolean;
        hash?: boolean;
        write?: boolean;
        /**
         * A file declared as **assigned** is exempt from the load assignment
         */
        assigned?: boolean;
    }

    export interface FileOptionsChild extends FileOptions {
        join?: boolean;
    }

    export interface Build {
        /**
         *
         * @param src - File source path
         * @param options - file options
         */
        addFile(src: string, options?: FileOptions): File;
        hasFile(src: string): boolean;
        getFile(src: string): File;
        getDest(src: string, hash?: boolean): File;
        isAssigned(src: string): boolean;
        plugins: Plugin[];
        files: Files;
        global: FillData;
        mode: "dev" | "build";
        log: Log;
        options: OptionsBuild;
        cycle: (listSrc: string[]) => Promise<void>;
    }

    export interface Query {
        find?: FillData<string | string[]>;
        limit?: number;
        sort?: FillData<number>;
    }

    export type PageQuery = FillData<Query>;

    export interface PageData {
        global?: string;
        link?: string;
        file?: string;
        slug?: string;
        permalink?: string;
        folder?: string;
        draft?: boolean;
        content?: string;
        template?: string;
        layout?: string;
        fragment?: string;
        archive?: Query;
        query?: PageQuery;
    }

    export interface YamlData {
        root?: FillData;
    }

    export type Data = PageData & YamlData & FillData;

    export interface File {
        root?: boolean;
        alerts?: string[];
        errors?: string[];
        link?: string;
        src?: string;
        dir?: string;
        dest?: string;
        name?: string;
        base?: string;
        type?: string;
        hash?: boolean;
        /**
         * If true, the file has been assigned to a plugin
         * so it is not processed until the watcher detects changes
         */
        assigned?: boolean;
        /**
         * Files that the file imports, allows incremental processing
         */
        imported?: string[];
        /**
         * Optional, allows to share data in the file
         */
        data?: Data;
        /**
         * Optional, allows to resolve asynchronous data
         */
        dataAsync?: Promise<Data>;
        /**
         * Content to be used if the file is written,
         * if the file does not define content,
         * the **src** will be copied to **dest**
         */
        content?: string;
        /**
         * Defines if the file will be observed by the watcher
         */
        watch?: boolean;
        /**
         * Defines if the file is written, **by default this value is true**
         */
        write?: boolean;
        /**
         * Original data of origin of the **src**
         */
        raw?: {
            base: string;
            file: string;
            dir: string;
        };
        /**
         * relate a **src** and send it to load and adds it to the global **watcher**
         */
        addChild?: (src: string, options?: FileOptionsChild) => Promise<File>;
        /**
         * read the resource based on the **src**
         */
        read?: () => Promise<string>;
        /**
         * Resolves a file from **src** source
         */
        join?: (src: string) => string;
        /**
         * Modify the link to write the file
         */
        setLink?: (...src: string[]) => string;
        /**
         * Associate an error with the file,
         * errors are cleaned up at plugin load
         */
        addError?: (message: string) => void;
        /**
         * Associate an alert with the file,
         * alerts are cleaned up at plugin load
         */
        addAlert?: (message: string) => void;
        /**
         * Get a link from the file **src**
         */
        addLink?: (src: string) => Promise<Link>;
    }

    export interface Files {
        [src: string]: File;
    }

    export interface PluginLog {
        clear(): void;
        errors(body: LogBody[]): void;
        alerts(body: LogBody[]): void;
    }

    export interface PluginsMessages {
        [name: string]: { errors: LogBody[]; alerts: LogBody[] };
    }

    export interface PluginsExternal {
        [plugin: string]: any;
    }

    export interface PluginContext extends Plugin {
        log?: PluginLog;
        cache?: any;
    }

    export interface Plugin {
        name: string;
        /**
         * Parallel process, initial and single execution hook
         */
        mounted?: (build: Build) => Promise<void> | void;
        /**
         * Filter the files to associate with the plugin
         */
        filter?: (file: File) => boolean;
        /**
         * Sequential process, it is executed before sending the files to the root load
         */
        buildStart?: (build: Build) => Promise<void> | void;
        /**
         * Parallel process, it is executed before the execution of the root load
         */
        beforeLoad?: (build: Build) => Promise<void> | void;
        /**
         * Hook that allows manipulating the file accepted by filter, this process can be executed
         * multiple times and recursively according to the consumption of the assets
         */
        load?: (currentFiles: File, build: Build) => Promise<void>;
        /**
         * Parallel process, it is executed after the execution of the root load
         */
        afterLoad?: (build: Build) => Promise<void> | void;
        /**
         * Sequential process, it is executed after sending the files to root load
         */
        buildEnd?: (build: Build) => Promise<void> | void;
    }
}
