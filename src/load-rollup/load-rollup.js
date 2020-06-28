const CACHE_ROLLUP = Symbol("_CacheRollup");

export function loadRollup(build, jsFiles) {
    const cache = build.getCache(CACHE_ROLLUP);
}
