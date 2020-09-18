import { PageData, Categories } from "./types";
import getProp from "@uppercod/get-prop";

type PipeItem = [string, any];

const AND = "&";
const OR = "|";

const ArrayEmpty: any[] = [];

export const select = (category: Categories, values: any[], mode = AND) =>
    values.reduce((pages: PageData[], name) => {
        const values = category[name];
        if (name == AND || name == OR) {
            mode = name;
            return pages;
        }
        if (ArrayEmpty == pages) {
            return values;
        } else if (mode == AND) {
            return [...pages.filter((data) => values.includes(data))];
        } else {
            return [
                ...pages,
                ...values.filter((data) => !pages.includes(data)),
            ];
        }
    }, ArrayEmpty);

export const where = (pages: PageData[], [find, equal]: [string, any]) =>
    pages.filter((page) => getProp(page, find) == equal);

export const order = (pages: PageData[], [find, mode = 1]: [string, number]) =>
    pages.sort((a, b) =>
        getProp(a, find) > getProp(b, find) ? mode : mode * -1
    );

export const limit = (pages: PageData[], value: number) =>
    pages.slice(0, value);
