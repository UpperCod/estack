import { File } from "estack";
import { expect } from "chai";
import { createBuildContext } from "../create-build-context";

const build = createBuildContext(
    {
        // actions must dispatch in order, first watch and then load
        async load(file) {},
        watch(file) {},
    },
    {
        types: {
            ts: "js",
        },
        assets: "",
        href: "",
    }
);

describe("createBuildContext", function () {
    /**
     * activation of actions
     */
    it("activation of actions when adding file", function (done) {
        let prevent = true;
        const task: { index: string; value: File }[] = [];
        const addTask = (index: string, value: File) => {
            task.push({ index, value });
            if (task.length == 2 && prevent) {
                prevent = false;
                // the time out is to check if the actions have been duplicated
                setTimeout(() => {
                    expect(task.length).to.equal(2);
                    expect(task[0]).to.deep.equal({
                        index: "watch",
                        value: file,
                    });
                    expect(task[1]).to.deep.equal({
                        index: "load",
                        value: file,
                    });
                    done();
                }, 10);
            }
        };
        const build = createBuildContext(
            {
                // actions must dispatch in order, first watch and then load
                async load(file) {
                    addTask("load", file);
                },
                watch(file) {
                    addTask("watch", file);
                },
            },
            {
                types: {
                    ts: "js",
                },
                assets: "",
                href: "",
            }
        );
        const src = "file.ts";
        const file = build.addFile(src);
        file.load();
    });
    /**
     * file properties
     */
    it("createBuildContext and addFile", function () {
        const src = "file.ts";
        const file = build.addFile(src);
        expect(build.getFile(src)).to.equal(file);
        // the following settings are minimal
        // for file processing operation
        expect(file.type).to.equal("js");
        expect(file.watch).is.true;
        expect(file.hash).is.false;
        expect(file.root).is.false;
        expect(file.asset).is.false;
        expect(file.src).is.string;
        expect(file.importers).to.deep.equal({});
        expect(file.errors).to.deep.equal([]);
    });
    it("addImporter", function () {
        const file1 = build.addFile("file1.js");
        const file2 = build.addFile("file2.js");
        build.addImporter(file1, file2);

        expect(file1.importers).to.deep.include({
            [file2.src]: { rewrite: true },
        });
    });
});
