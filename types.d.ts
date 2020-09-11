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
         * Origen del archivo
         */
        src: string;
        /**
         * Declara si es una improtacion desde la build
         */
        root: boolean;
        /**
         *  Declara si el archivo debe ser cargado por un plugin
         */
        load: boolean;
        /**
         * **Opcional**, Puede ser usado para compartir informacion
         */
        data?: any;
        /**
         * Indica si el archivo debe hachear su url
         */
        hash: boolean;
        /**
         * Define el tipo del archivo
         */
        type: string;
        /**
         * Declara que el archivo se ha asociado al watcher
         */
        watch: boolean;
        /**
         * Declara que el archivo sera escrito en el modo build
         */
        write: boolean;
        /**
         * Meta del origen dado por `path.parse`
         */
        meta: Meta;
        /**
         * Errores asociado al archivo
         */
        errors: string[];
        /**
         * Indica si el archivo a sido tomado por un plugin
         */
        assigned?: boolean;
        /**
         * Contenido del archivo a ser usado para la escritura
         */
        content?: string;
        /**
         * `file.src` relacionado por el archivo, permite indentificar quien importa el archivo.
         */
        importers: Importers;
        /**
         * Destino del archivo
         */
        dest?: string;
        /**
         * Link del archivo
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
         * Añade un archivo
         * @param src - origen del archivo
         * @param config - configuracion del archivo
         */
        addFile(src: string, config?: FileConfig): Promise<File>;
        /**
         * Asocia una relacion de importacion entre file y importer.
         * @param file - archivo a asociar la importacion.
         * @param importer - archivo importado.
         * @param config - configuracion de la importacion.
         */
        addImporter(file: File, importer: File, config?: WatchConfig): void;
        /**
         * Elimina el registro del archivo de la build.
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
