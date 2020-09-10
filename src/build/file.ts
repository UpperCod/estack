import { Context } from "@uppercod/imported";
import { File, FileOptionsChild, Build } from "estack";
import * as path from "path";
import * as fs from "fs/promises";
import { isHtml } from "../utils/types";

const readFile = (src: string) => fs.readFile(src, "utf8");

type Options = Pick<Build, "getDest" | "addFile" | "getFile">;

export const createSetFile = (build: Options, tree: Context) => (
    file: File,
    load: (file: File) => Promise<void>
) => {
    if (file.setLink) return;
    Object.assign(file, {
        ...build.getDest(file.src, file.hash),
        errors: [],
        alerts: [],
        read: () => readFile(file.src),
        join: (src: string) => path.join(file.raw.dir, src),
        async addChild(
            src: string,
            { join = true, ...options }: FileOptionsChild = {}
        ) {
            const childFile = build.addFile(
                join ? file.join(src) : src,
                options
            );

            if (options.watch ?? true) {
                tree.addChild(file.src, childFile.src);
            }
            if (!childFile.assigned) await load(childFile);
            return childFile;
        },
        async addLink(src: string) {
            if (isHtml(src)) {
                const nextSrc = file.join(src);
                return {
                    get link() {
                        return build.getFile(nextSrc).link;
                    },
                    get linkTitle() {
                        return build.getFile(nextSrc).data.linkTitle;
                    },
                };
            } else {
                const {
                    link,
                    raw: { base: linkTitle },
                } = await file.addChild(src);
                return { link, linkTitle };
            }
        },
        setLink(...args: string[]): string {
            const { raw } = file;
            Object.assign(file, build.getDest(path.join(...args)), file.hash);
            file.raw = raw;
            return file.link;
        },
        addError(message: string) {
            message += "";
            if (!file.errors.includes(message)) {
                file.errors.push(message);
            }
        },
        addAlert(message: string) {
            message += "";
            if (!file.alerts.includes(message)) {
                file.alerts.push(message);
            }
        },
    } as File);
};
