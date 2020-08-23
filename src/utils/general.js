/**
 * Change the catch to null
 * @param {Promise} promise
 */
export let promiseErrorToNull = async (promise) => promise.catch((e) => null);
/**
 * Transform a prop map to an object
 * @param {({prop:string,value:any}[])} list
 * @returns {{[prop:string]:any}}
 */
export function mapPropToObject(list) {
    let length = list.length;
    let obj = {};
    for (let i = 0; i < length; i++) {
        obj[list[i].prop] = list[i].value;
    }
    return obj;
}
