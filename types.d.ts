declare module "estack" {
    interface Meta {
        /**
         * The root of the path such as '/' or 'c:\'
         */
        root: string;
        /**
         * The full directory path such as '/home/user/dir' or 'c:\path\dir'
         */
        dir: string;
        /**
         * The file name including extension (if any) such as 'index.html'
         */
        base: string;
        /**
         * The file extension (if any) such as '.html'
         */
        ext: string;
        /**
         * The file name without extension (if any) such as 'index'
         */
        name: string;
    }

    interface FileConfig {
        watch?: boolean;
        write?: boolean;
        load?: boolean;
        assigned?: boolean;
        hash?: boolean;
    }

    interface File {
        src: string;
        data?: any;
        hash: boolean;
        type: string;
        watch: boolean;
        write: boolean;
        meta: Meta;
        errors: string[];
        assigned: boolean;
        content?: string;
        imported: Map<string, WatchConfig>;
        dest?: string;
        link?: string;
    }

    interface Files {
        [file: string]: File;
    }

    interface WatchConfig {
        rewrite?: boolean;
    }

    interface Build {
        files: { [src: string]: File };
        hasFile(src: string): boolean;
        getFile(src: string): File;
        addFile(src: string, config?: FileConfig): Promise<File>;
        addChild(file: File, childFile: File, config?: WatchConfig): void;
        setLink(file: File, link: string): void;
        resolveFromFile(file: File, src: string): string;
        readFile(file: File): Promise<string>;
        addError(file: File, error: string): void;
        options?: Options;
    }

    interface Plugin {
        name: string;
        mounted?: (build: Build) => Promise<void> | void;
        filter?: (file: File) => boolean;
        load?: (file: File, build: Build) => Promise<void> | void;
        buildStart?: (build: Build) => Promise<void> | void;
        beforeLoad?: (build: Build) => Promise<void> | void;
        afterLoad?: (build: Build) => Promise<void> | void;
        buildEnd?: (build: Build) => Promise<void> | void;
    }

    interface OptionsBuild {
        mode: "dev" | "build";
        src?: string;
        dest?: string;
        port?: number;
        href?: string;
        sourcemap?: boolean;
        watch?: boolean;
        js: string;
        css: string;
        external: string[];
    }

    interface PluginsExternal {
        [plugin: string]: any;
    }

    interface Options extends Omit<OptionsBuild, "src" | "js" | "css"> {
        js: any[];
        css: any[];
        glob: string[];
        server?: boolean;
    }
}
