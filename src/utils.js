import path from "path";

let cwd = process.cwd();

export function relative(url) {
	return path.relative(cwd, url).replace(/(\\){1,2}/g, "/");
}

export function mergeKeysArray(keys, ...config) {
	keys.forEach(index => {
		config[0][index] = Array.from(
			new Map(
				config.reduce(
					(nextConfig, config) =>
						nextConfig.concat(
							(config[index] || []).map(value =>
								Array.isArray(value) ? value : [value]
							)
						),
					[]
				)
			)
		);
	});
	return config[0];
}
