declare module "estack" {
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
        js?: FillData;
        css?: FillData;
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
        isRoot?: boolean;
        watch?: boolean;
        hash?: boolean;
        write?: boolean;
    }

    export interface Build {
        addFile(src: string, options: FileOptions): File;
        hasFile(src: string): boolean;
        getFile(src: string): File;
        getDest(src: string): File;
        getSrc(src: string): string;
        isAssigned(src: string): boolean;
        plugins: Plugin[];
        files: Files;
        global: FillData;
        mode: "dev" | "build";
        log: Log;
        options: OptionsBuild;
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
        alerts?: string[];
        errors?: string[];
        link?: string;
        src?: string;
        dir?: string;
        dest?: string;
        name?: string;
        base?: string;
        type?: string;
        assigned?: boolean;
        imported?: string[];
        data?: Data;
        dataAsync?: Promise<Data>;
        content?: string;
        watch?: boolean;
        write?: boolean;
        raw?: {
            base: string;
            file: string;
            dir: string;
        };
        addChild?: (src: string) => Promise<File>;
        read?: () => Promise<string>;
        join?: (src: string) => string;
        setLink?: (...src: string[]) => string;
        addError?: (message: string) => void;
        addAlert?: (message: string) => void;
        addLink?: (src: string) => Promise<Link>;
    }

    export interface Files {
        [src: string]: File;
    }

    export interface PluginLog {
        clear(): void;
        errors(body: LogBody[]): void;
        alerts(body: LogBody[]): void;
        build(): void;
    }

    export interface PluginsMessages {
        [name: string]: { errors: LogBody[]; alerts: LogBody[] };
    }

    export interface PluginContext extends Plugin {
        log?: PluginLog;
        cache?: any;
    }

    export interface Plugin {
        name: string;
        mounted?: (this: PluginContext, build: Build) => Promise<void> | void;
        filter?: (this: PluginContext, file: File) => boolean;
        buildStart?: (
            this: PluginContext,
            build: Build
        ) => Promise<void> | void;
        beforeLoad?: (
            this: PluginContext,
            build: Build
        ) => Promise<void> | void;
        load?: (
            this: PluginContext,
            currentFiles: File,
            build: Build
        ) => Promise<void>;
        afterLoad?: (this: PluginContext, build: Build) => Promise<void> | void;
        buildEnd?: (this: PluginContext, build: Build) => Promise<void> | void;
    }
}
