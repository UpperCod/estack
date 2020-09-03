declare module "@estack/core" {
    export interface FillData {
        [index: string]: any;
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

    export interface PageData {
        link?: string;
        slug?: string;
        permalink?: string;
        folder?: string;
        draft?: boolean;
        content?: string;
        template?: string;
        layout?: string;
        fragment?: string;
    }

    export interface YamlData {
        root?: FillData;
    }

    export type Data = PageData & YamlData & FillData;

    export interface PropsFile {
        errors: string[];
        link: string;
        src: string;
        dir: string;
        name: string;
        base: string;
        type: string;
        assigned: boolean;
        imported: string[];
        data: Data;
        dataAsync: Promise<Data>;
        content?: string;
        raw: {
            base: string;
            file: string;
            dir: string;
        };
        addChild(src: string): Promise<File>;
        read(): Promise<string>;
        join(src: string): string;
        setLink(...src: string[]): string;
        addError(message: string): void;
        addLink(src: string): Promise<Link>;
    }

    export type File = Partial<PropsFile>;

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
