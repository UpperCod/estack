/**
 * Logger marker for the build process used by the core
 */
export const MARK_ROOT = "EStack";
/**
 * Logger marker for the build process used by Rollup
 */
export const MARK_ROLLUP = "Rollup";
/**
 * Start message for transformation syntax errors
 */
export const ERROR_TRANSFORMING = "SyntaxError: Transforming,";
/**
 *
 */
export const ERROR_DUPLICATE_ID = "SyntaxError: Duplicate identifier,";
/**
 * Start message for request errors
 */
export const ERROR_FETCH = "FetchError:";
/**
 * Start message for errors for file not found
 */
export const ERROR_FILE_NOT_FOUNT = "FileNotFound:";
/**
 * Index to define private values in the context used by liquidjs.
 * Allows access to the fragments object
 */
export const DATA_FRAGMENTS = Symbol("_fragments");
/**
 * Index to define private values in the context used by liquidjs.
 * Allows access to the layout associated with the render instance
 */
export const DATA_LAYOUT = Symbol("_layout");
/**
 * Index to define private values in the context used by liquidjs.
 * Allows access to the page associated with the render instance
 */
export const DATA_PAGE = Symbol("_page");
/**
 * Index to define private values in the context used by liquidjs.
 * It allows defining if the render instance is executed from layout
 */
export const FROM_LAYOUT = Symbol("_fromLayout");
/**
 * Index to define private values in the context used by liquidjs.
 * Allows you to create a list of assets shared between page and template
 */
export const PAGE_ASSETS = Symbol("_pageAssets");
