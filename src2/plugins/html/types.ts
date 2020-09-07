import { PageData, FillData, File } from "estack";

export interface RenderData {
    file: File;
    global: FillData;
    page: PageData;
    layout?: PageData;
    content?: string;
}
