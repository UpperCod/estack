declare module "@estack/core" {
    interface OptionsDest {
        assetHashPattern: string;
        assetsWithoutHash: RegExp;
        assetsDir: string;
        dest: string;
        href: string;
    }

    export interface Options extends OptionsDest {
        mode: string;
        src: string | string[];
        external?: string | string[];
        jsx?: string;
        jsxFragment?: string;
        silent?: string;
        minify?: string;
        port?: string;
        sourcemap?: boolean;
    }

    export interface FillData<T = any> {
        [index: string]: T;
    }

    export interface Link extends FillData {
        link: string;
        linkTitle: string;
    }

    export interface Build {
        addFile(src: string, isRoot?: boolean): File;
        hasFile(src: string): boolean;
        getFile(src: string): File;
        getSrc(src: string): string;
        isAssigned(src: string): boolean;
        plugins: Plugin[];
        files: Files;
        global: FillData;
        mode: "dev" | "build";
    }

    export interface PageQuery {
        find?: FillData<string | string[]>;
        limit?: number;
        sort?: FillData<number>;
    }

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
        archive?: FillData<PageQuery>;
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
        name?: string;
        base?: string;
        type?: string;
        assigned?: boolean;
        imported?: string[];
        data?: Data;
        dataAsync?: Promise<Data>;
        content?: string;
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

    export interface Plugin {
        name: string;
        mounted?: (build: Build) => Promise<void> | void;
        beforeLoad?: (build: Build) => Promise<void> | void;
        afterLoad?: (build: Build) => Promise<void> | void;
        filter?: (file: File) => boolean;
        load?: (currentFiles: File[], build: Build) => Promise<void>;
    }
}
