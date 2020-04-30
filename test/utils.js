const normalizeData = (str) => {
  str = Array.isArray(str) ? str.join("\n") : str;
  return str.replace(/(\r\n|\n|\r)/gm, "");
};

module.exports = { normalizeData };
