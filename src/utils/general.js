import yaml from "js-yaml";

/**
 * Gets the value of an object based on the index
 * @param {object} value
 * @param {string} prop - search index
 * @param {*} optionValue - optional return value in case the index cannot be resolved
 */
export let getProp = (value, prop, optionValue) => {
  value = value || {};
  prop = Array.isArray(prop) ? prop : prop.match(/([^\[\]\.]+)/g);
  for (let i = 0; i < prop.length; i++) {
    if (typeof value === "object" && prop[i] in value) {
      value = value[prop[i]];
    } else {
      return optionValue;
    }
  }
  return value;
};

export let yamlParse = (string) => yaml.safeLoad(string);

export let yamlStringify = (object) => yaml.safeDump(object);

/**
 * Change the catch to null
 * @param {Promise} promise
 */
export let promiseErrorToNull = async (promise) => promise.catch((e) => null);
