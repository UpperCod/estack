const CACHE_ROLLUP = Symbol("_CacheRollup");

export function loadRollup(build, jsFiles) {
    const cache = (build.cache[CACHE_ROLLUP] = build.cache[CACHE_ROLLUP] || {});
}
