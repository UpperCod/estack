import fs from 'fs';
import stream from 'stream';
import zlib from 'zlib';
import util from 'util';

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var writeMethods = ["write", "end", "destroy"];
var readMethods = ["resume", "pause"];
var readEvents = ["data", "close"];
var slice = Array.prototype.slice;
var duplexer = duplex;

function forEach(arr, fn) {
  if (arr.forEach) {
    return arr.forEach(fn);
  }

  for (var i = 0; i < arr.length; i++) {
    fn(arr[i], i);
  }
}

function duplex(writer, reader) {
  var stream$1 = new stream();
  var ended = false;
  forEach(writeMethods, proxyWriter);
  forEach(readMethods, proxyReader);
  forEach(readEvents, proxyStream);
  reader.on("end", handleEnd);
  writer.on("drain", function () {
    stream$1.emit("drain");
  });
  writer.on("error", reemit);
  reader.on("error", reemit);
  stream$1.writable = writer.writable;
  stream$1.readable = reader.readable;
  return stream$1;

  function proxyWriter(methodName) {
    stream$1[methodName] = method;

    function method() {
      return writer[methodName].apply(writer, arguments);
    }
  }

  function proxyReader(methodName) {
    stream$1[methodName] = method;

    function method() {
      stream$1.emit(methodName);
      var func = reader[methodName];

      if (func) {
        return func.apply(reader, arguments);
      }

      reader.emit(methodName);
    }
  }

  function proxyStream(methodName) {
    reader.on(methodName, reemit);

    function reemit() {
      var args = slice.call(arguments);
      args.unshift(methodName);
      stream$1.emit.apply(stream$1, args);
    }
  }

  function handleEnd() {
    if (ended) {
      return;
    }

    ended = true;
    var args = slice.call(arguments);
    args.unshift("end");
    stream$1.emit.apply(stream$1, args);
  }

  function reemit(err) {
    stream$1.emit("error", err);
  }
}

const processFn = (fn, options) => function (...args) {
  const P = options.promiseModule;
  return new P((resolve, reject) => {
    if (options.multiArgs) {
      args.push((...result) => {
        if (options.errorFirst) {
          if (result[0]) {
            reject(result);
          } else {
            result.shift();
            resolve(result);
          }
        } else {
          resolve(result);
        }
      });
    } else if (options.errorFirst) {
      args.push((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    } else {
      args.push(resolve);
    }

    fn.apply(this, args);
  });
};

var pify = (input, options) => {
  options = Object.assign({
    exclude: [/.+(Sync|Stream)$/],
    errorFirst: true,
    promiseModule: Promise
  }, options);
  const objType = typeof input;

  if (!(input !== null && (objType === 'object' || objType === 'function'))) {
    throw new TypeError(`Expected \`input\` to be a \`Function\` or \`Object\`, got \`${input === null ? 'null' : objType}\``);
  }

  const filter = key => {
    const match = pattern => typeof pattern === 'string' ? key === pattern : pattern.test(key);

    return options.include ? options.include.some(match) : !options.exclude.some(match);
  };

  let ret;

  if (objType === 'function') {
    ret = function (...args) {
      return options.excludeMain ? input(...args) : processFn(input, options).apply(this, args);
    };
  } else {
    ret = Object.create(Object.getPrototypeOf(input));
  }

  for (const key in input) {
    // eslint-disable-line guard-for-in
    const property = input[key];
    ret[key] = typeof property === 'function' && filter(key) ? processFn(property, options) : property;
  }

  return ret;
};

var gzipSize = createCommonjsModule(function (module) {











const getOptions = options => Object.assign({
  level: 9
}, options);

module.exports = (input, options) => {
  if (!input) {
    return Promise.resolve(0);
  }

  return pify(zlib.gzip)(input, getOptions(options)).then(data => data.length).catch(_ => 0);
};

module.exports.sync = (input, options) => zlib.gzipSync(input, getOptions(options)).length;

module.exports.stream = options => {
  const input = new stream.PassThrough();
  const output = new stream.PassThrough();
  const wrapper = duplexer(input, output);
  let gzipSize = 0;
  const gzip = zlib.createGzip(getOptions(options)).on('data', buf => {
    gzipSize += buf.length;
  }).on('error', () => {
    wrapper.gzipSize = 0;
  }).on('end', () => {
    wrapper.gzipSize = gzipSize;
    wrapper.emit('gzip-size', gzipSize);
    output.end();
  });
  input.pipe(gzip);
  input.pipe(output, {
    end: false
  });
  return wrapper;
};

module.exports.file = (path, options) => {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(path);
    stream.on('error', reject);
    const gzipStream = stream.pipe(module.exports.stream(options));
    gzipStream.on('error', reject);
    gzipStream.on('gzip-size', resolve);
  });
};

module.exports.fileSync = (path, options) => module.exports.sync(fs.readFileSync(path), options);
});
var gzipSize_1 = gzipSize.sync;
var gzipSize_2 = gzipSize.stream;
var gzipSize_3 = gzipSize.file;
var gzipSize_4 = gzipSize.fileSync;

var dist = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});











const readFilePromise = util.promisify(fs.readFile);

const bufferFormatter = incoming => typeof incoming === 'string' ? Buffer.from(incoming, 'utf8') : incoming;

const optionFormatter = (passed, toEncode) => ({
  params: {
    [zlib.constants.BROTLI_PARAM_MODE]: passed && 'mode' in passed && passed.mode || zlib.constants.BROTLI_DEFAULT_MODE,
    [zlib.constants.BROTLI_PARAM_QUALITY]: passed && 'quality' in passed && passed.quality || zlib.constants.BROTLI_MAX_QUALITY,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: toEncode ? toEncode.byteLength : 0
  }
});
/**
 * @param incoming Either a Buffer or string of the value to encode.
 * @param options Subset of Encoding Parameters.
 * @return Promise that resolves with the encoded Buffer length.
 */


async function size(incoming, options) {
  const buffer = bufferFormatter(incoming);
  return new Promise(function (resolve, reject) {
    zlib.brotliCompress(buffer, optionFormatter(options, buffer), (error, result) => {
      if (error !== null) {
        reject(error);
      }

      resolve(result.byteLength);
    });
  });
}

exports.default = size;
/**
 * @param incoming Either a Buffer or string of the value to encode.
 * @param options Subset of Encoding Parameters.
 * @return Length of encoded Buffer.
 */

function sync(incoming, options) {
  const buffer = bufferFormatter(incoming);
  return zlib.brotliCompressSync(buffer, optionFormatter(options, buffer)).byteLength;
}

exports.sync = sync;
/**
 * @param options
 * @return PassThroughStream for the contents being compressed
 */

function stream$1(options) {
  const input = new stream.PassThrough();
  const output = new stream.PassThrough();
  const wrapper = duplexer(input, output);
  let size = 0;
  const brotli = zlib.createBrotliCompress(optionFormatter(options)).on('data', buf => {
    size += buf.length;
  }).on('error', () => {
    wrapper.brotliSize = 0;
  }).on('end', () => {
    wrapper.brotliSize = size;
    wrapper.emit('brotli-size', size);
    output.end();
  });
  input.pipe(brotli);
  input.pipe(output, {
    end: false
  });
  return wrapper;
}

exports.stream = stream$1;
/**
 * @param path File Path for the file to compress.
 * @param options Subset of Encoding Parameters.
 * @return Promise that resolves with size of encoded file.
 */

async function file(path, options) {
  const file = await readFilePromise(path);
  return await size(file, options);
}

exports.file = file;
/**
 * @param path File Path for the file to compress.
 * @param options Subset of Encoding Parameters.
 * @return size of encoded file.
 */

function fileSync(path, options) {
  const file = fs.readFileSync(path);
  return sync(file, options);
}

exports.fileSync = fileSync;
});

unwrapExports(dist);
var dist_1 = dist.sync;
var dist_2 = dist.stream;
var dist_3 = dist.file;
var dist_4 = dist.fileSync;

var simpleStringTable = function table(rows, padding = 2) {
  let spaces = rows.reduce((spaces, row) => row.reduce((spaces, value, index) => {
    value = "" + value;

    if (spaces[index] < value.length || spaces[index] == null) {
      spaces[index] = value.length;
    }

    return spaces;
  }, spaces), []);
  return rows.map(row => row.map((value, index) => value + " ".repeat(spaces[index] - value.length + padding)).join("")).join("\n");
};

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var getGzip = _interopDefault(gzipSize);

var getBrotli = _interopDefault(dist);

var table = _interopDefault(simpleStringTable);

let color = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m"
};

function toKB(size) {
  return (size / 1000).toFixed(2) + "KB";
}

function sizes(limit, customLog) {
  if (limit) {
    let danger = Number(("" + limit).replace(/kb/gi, "")) * 1000;
    limit = {
      danger,
      warning: danger * 0.9
    };
  }

  function getColor(size) {
    if (!limit) return color.green;
    return size > limit.danger ? color.red : size > limit.warning ? color.yellow : color.green;
  }

  return {
    name: "@atomico/rollup-plugin-sizes",

    async writeBundle(bundles) {
      let rows = [[bundles.length > 1 ? "FILES" : "FILE", "GZIP", "BROTLI"]];
      let totalGzip = 0;
      let totalBroli = 0;
      let sizes = {};
      let index = 1;

      for (let key in bundles) {
        let code = bundles[key].code;
        if (typeof code !== "string") continue;
        let gzip = await getGzip(code);
        let brotli = await getBrotli(code);
        totalGzip += gzip;
        totalBroli += brotli;
        sizes[index++] = gzip;
        rows.push([key, toKB(gzip), toKB(brotli)]);
      }

      if (bundles.length > 1) {
        rows.push(["", toKB(totalGzip), toKB(totalBroli)]);
      }

      sizes[index] = totalGzip;

      if (customLog) {
        customLog(rows);
      } else {
        console.log([color.reset].concat(table(rows).split("\n").map((stringRow, index) => (sizes[index] ? getColor(sizes[index]) : "") + stringRow), color.reset).join("\n"));
      }
    }

  };
}

var rollupPluginSizes = sizes;

export default rollupPluginSizes;
//# sourceMappingURL=index2.js.map
