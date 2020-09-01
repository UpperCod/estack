declare module "@estack/core" {
    export interface FillData {
        [index: string]: any;
    }

    export interface Build {
        addFile(src: string): File;
        hasFile(src: string): boolean;
        getFile(src: string): File;
        getSrc(src: string): string;
        plugins: Plugin[];
        files: Files;
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
        link: string;
        src: string;
        dir: string;
        name: string;
        base: string;
        ext: string;
        prevent: boolean;
        imported: string[];
        data: Data;
        dataAsync: Promise<Data>;
        addChild(src: string): Promise<File>;
        read(): Promise<string>;
        join(src: string): string;
        setLink(...src: string[]): string;
    }

    export type File = Partial<PropsFile>;

    export interface Files {
        [src: string]: File;
    }

    export interface Plugin {
        name: string;
        filter(file: File): boolean;
        load(currentFiles: File[], files: Files): Promise<void>;
    }
}
