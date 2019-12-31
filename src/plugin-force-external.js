export const DOUBLE_SLASH = `DOUBLE_${Math.random()}_SLASH`;

export function pluginForceExternal() {
  return {
    name: "force-external",
    resolveId(id) {
      if (/^(http(s){0,1}\:){0,1}\/\/.*/.test(id)) {
        id = id.replace(/^(\/\/)/, `${DOUBLE_SLASH}$1`);
        return { id, external: true };
      }
    }
  };
}
