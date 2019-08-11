import sade from "sade";
import createBundle from "./create-bundle";

sade("pack <src> [dest]")
	.version("0.0.0")
	.option("-c, --config", "Provide path to custom config", "package.json")
	.option("-w, --watch", "Provide path to custom config")
	.example("src/index.js dist --watch")
	.example("src/*.js dist --watch")
	.example("src/*.html dist --watch")
	.action((src, dir = "dist", opts) => {
		createBundle(
			{
				entry: src.split(/ *, */g),
				watch: opts.watch
			},
			{ dir }
		);
	})
	.parse(process.argv);
