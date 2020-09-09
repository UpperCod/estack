import { PageData, FillData, File } from "estack";

export type RenderDataQuery = FillData<PageData[] | PageData[][]>;

export interface RenderData {
    file: File;
    global: FillData;
    page: PageData;
    layout?: PageData;
    content?: string;
    query?: RenderDataQuery;
}
