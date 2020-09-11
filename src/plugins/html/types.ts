import { File } from "estack";

export interface Page extends Omit<File, "data"> {
    data: PageData;
}

export interface Pages {
    [link: string]: Page;
}

export interface PageData {
    id: string;
    link?: string;
    category?: string[];
    fragment?: string;
    template?: string;
    layout?: string;
    global?: string;
    content?: string;
}

export interface RenderData {
    file: Page;
    page: PageData;
    category: Categories;
    layout: PageData;
}

export interface RenderDataFragment {
    file: Page;
}

export interface Globals {
    [index: string]: PageData;
}

export interface Categories {
    [category: string]: PageData[];
}
