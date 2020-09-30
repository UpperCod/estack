import { File } from "estack";

export interface ActionsBuild {
    watch: (file: File) => void;
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
