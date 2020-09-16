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
    /**
     * Configuration at the time of file creation.
     */
    interface FileConfig {
        /**
         * `watch=true` : Indica should be added to the watcher.
         */
        watch?: boolean;
        /**
         * `write=true` : Indicates that the file must be written to disk in build mode.
         */
        write?: boolean;
        /**
         * `load=true` : Indicates that the file can be uploaded by plugins.
         */
        load?: boolean;
        /**
         * `asset=false` : indicates if it is an asset file, by default when hash
         * is defined the file will be recognized as an asset
         */
        asset?: boolean;
        /**
         * `autoload=true` : Indicates that the file will be sent to load if it has
         * just been created
         */
        autoload?: boolean;
        /**
         * `hash=false` : indicates whether to generate a hash path for writing.
         */
        hash?: boolean;
        /**
         * `root=false` : Indicates that the file is sent from the build
         */
        root?: boolean;
    }

    interface Importers {
        [importer: string]: WatchConfig;
    }

    interface File {
        /**
         * Origin of the file
         */
        src: string;
        /**
         * Declare if it is an import from the build
         */
        root: boolean;
        /**
         *  Declare if the file should be loaded by a plugin
         */
        load: boolean;

        autoload?: boolean;
        /**
         * **Optional**, Can be used to share information
         */
        data?: any;
        /**
         * Indicates if the file should hack its url
         */
        hash: boolean;
        /**
         * Indicates if the file is an asset, by default all
         * hash files are assets but these are made and you
         * can declare an asset file that escapes the hash
         */
        asset: boolean;
        /**
         * Defines the file type
         */
        type: string;
        /**
         * Declara que el archivo se ha asociado al watcher
         */
        watch: boolean;
        /**
         * Declare that the file will be written in build mode
         */
        write: boolean;
        /**
         * Origin meta given by `path.parse`
         */
        meta: Meta;
        /**
         * Errors associated with the file
         */
        errors: string[];
        /**
         * Indicates if the file has been taken by a plugin
         */
        assigned?: boolean;
        /**
         * File content to be used for writing
         */
        content?: string;
        /**
         * `file.src` related by the file, allows to identify who imports the file.
         */
        importers: Importers;
        /**
         * File destination
         */
        dest?: string;
        /**
         * File link
         */
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
        /**
         * Add a file
         * @param src - file origin
         * @param config - file configuration
         */
        addFile(src: string, config?: FileConfig): Promise<File>;
        /**
         * Associate an import relation between file and importer.
         * @param file - file to associate the import.
         * @param importer - imported file.
         * @param config - import settings.
         */
        addImporter(file: File, importer: File, config?: WatchConfig): void;
        /**
         * Unregister the build file.
         * @param src
         */
        removeFile(src: string): void;
        setLink(file: File, link: string): void;
        resolveFromFile(file: File, src: string): string;
        readFile(file: File): Promise<string>;
        addError(file: File, error: string): void;
        rebuild?: (src?: string[]) => Promise<void>;
        options?: Options;
    }

    interface Plugin {
        name: string;
        loads?: number;
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
        assets?: string;
        sourcemap?: boolean;
        watch?: boolean;
        js?: string;
        css?: string;
        external?: string[];
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
