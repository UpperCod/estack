import { File } from "estack";

export interface ActionsBuild {
    load: (file: File) => Promise<void>;
    watch: (file: File) => void;
    error: (file: File) => void;
}

export interface Types {
    [type: string]: string;
}

export interface ConfigBuild {
    href: string;
    assets: string;
    types: Types;
}

export type Load = (file: File) => Promise<void>;
