import { File, Site } from "estack";

export interface Replace {
    [hash: string]: string;
}

export interface Page extends Omit<File, "data"> {
    data: PageData;
}

export interface Pages {
    [link: string]: Page;
}

export interface PageData {
    id?: string;
    link?: string;
    file?: string;
    lang?: string;
    langs?: PageData[];
    slug?: string;
    category?: string[];
    fragment?: string;
    template?: string;
    layout?: string;
    content?: string;
    date?: string;
    parentLang?: string;
}

export interface RenderData {
    file: Page;
    page: PageData;
    category: Categories;
    layout: PageData;
    content: string;
    site: Site;
}

export interface RenderDataFragment {
    file: Page;
}

export interface Categories {
    [category: string]: PageData[];
}

export interface ParentLangs {
    [parent: string]: PageData[];
}
