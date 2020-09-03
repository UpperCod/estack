import { PageData, FillData, File } from "@estack/core";

export interface RenderData {
    file: File;
    global: FillData;
    page: PageData;
    layout?: PageData;
    content?: string;
}
