interface Parts {
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

declare module "estack/internal" {
    type Load = (file: File) => Promise<void>;

    interface FileConfig {
        watch?: boolean;
        write?: boolean;
        load?: boolean;
        assigned?: boolean;
        hash?: boolean;
    }

    interface File {
        src: string;
        hash: boolean;
        type: string;
        watch: boolean;
        write: boolean;
        parts: Parts;
        assigned: boolean;
        imported: Map<string, WatchConfig>;
        addChild(src: string, config?: WatchConfig): void;
        setLink(src: string): void;
        dest?: string;
        link?: string;
    }

    interface Files {
        [file: string]: File;
    }

    interface WatchConfig {
        rewrite?: boolean;
    }

    interface Build {}

    interface Plugin {
        name: string;
        mounted?: (build: Build) => Promise<void> | void;
        filter?: (file: File) => boolean;
        load?: (file: File, build: Build) => Promise<void> | void;
    }

    interface ActionsBuild {
        load: (file: File) => Promise<void>;
        watch: (file: File) => void;
    }

    interface Types {
        [type: string]: string;
    }

    interface ConfigBuild {
        href: string;
        assets: string;
        types: Types;
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
