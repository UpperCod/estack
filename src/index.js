import sade from "sade";
import createBundle from "./create-bundle";

sade("bundle [src] [dest]")
	.version("0.0.0")
	.option(
		"-w, --watch",
		"Watch files in bundle and rebuild on changes",
		false
	)
	.option(
		"-e, --external",
		"Does not include dependencies in the bundle",
		false
	)
	.option("--shimport", "enable the use of shimport in the html", false)
	.option("--browsers", "define the target of the bundle", "last 2 versions")
	.example("src/index.js dist --watch")
	.example("src/*.js dist")
	.example("src/*.html")
	.example("")
	.action((src, dir = "dist", opts) => {
		createBundle(
			{
				...opts,
				entry: src ? src.split(/ *, */g) : []
			},
			{ dir }
		);
	})
	.parse(process.argv);
