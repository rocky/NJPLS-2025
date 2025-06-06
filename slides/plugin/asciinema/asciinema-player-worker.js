(function () {
  'use strict';

  function parseNpt(time) {
    if (typeof time === "number") {
      return time;
    } else if (typeof time === "string") {
      return time.split(":").reverse().map(parseFloat).reduce((sum, n, i) => sum + n * Math.pow(60, i));
    } else {
      return undefined;
    }
  }

  class DummyLogger {
    log() {}
    debug() {}
    info() {}
    warn() {}
    error() {}
  }
  class PrefixedLogger {
    constructor(logger, prefix) {
      this.logger = logger;
      this.prefix = prefix;
    }
    log(message) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      this.logger.log(`${this.prefix}${message}`, ...args);
    }
    debug(message) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      this.logger.debug(`${this.prefix}${message}`, ...args);
    }
    info(message) {
      for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }
      this.logger.info(`${this.prefix}${message}`, ...args);
    }
    warn(message) {
      for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        args[_key4 - 1] = arguments[_key4];
      }
      this.logger.warn(`${this.prefix}${message}`, ...args);
    }
    error(message) {
      for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        args[_key5 - 1] = arguments[_key5];
      }
      this.logger.error(`${this.prefix}${message}`, ...args);
    }
  }

  let wasm;
  const heap = new Array(128).fill(undefined);
  heap.push(undefined, null, true, false);
  function getObject(idx) {
    return heap[idx];
  }
  let heap_next = heap.length;
  function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
  }
  function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
  }
  const cachedTextDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', {
    ignoreBOM: true,
    fatal: true
  }) : {
    decode: () => {
      throw Error('TextDecoder not available');
    }
  };
  if (typeof TextDecoder !== 'undefined') {
    cachedTextDecoder.decode();
  }
  let cachedUint8Memory0 = null;
  function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
      cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
  }
  function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
  }
  function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];
    heap[idx] = obj;
    return idx;
  }
  function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
      return `${val}`;
    }
    if (type == 'string') {
      return `"${val}"`;
    }
    if (type == 'symbol') {
      const description = val.description;
      if (description == null) {
        return 'Symbol';
      } else {
        return `Symbol(${description})`;
      }
    }
    if (type == 'function') {
      const name = val.name;
      if (typeof name == 'string' && name.length > 0) {
        return `Function(${name})`;
      } else {
        return 'Function';
      }
    }
    // objects
    if (Array.isArray(val)) {
      const length = val.length;
      let debug = '[';
      if (length > 0) {
        debug += debugString(val[0]);
      }
      for (let i = 1; i < length; i++) {
        debug += ', ' + debugString(val[i]);
      }
      debug += ']';
      return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
      className = builtInMatches[1];
    } else {
      // Failed to match the standard '[object ClassName]'
      return toString.call(val);
    }
    if (className == 'Object') {
      // we're a user defined class or Object
      // JSON.stringify avoids problems with cycles, and is generally much
      // easier than looping through ownProperties of `val`.
      try {
        return 'Object(' + JSON.stringify(val) + ')';
      } catch (_) {
        return 'Object';
      }
    }
    // errors
    if (val instanceof Error) {
      return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
  }
  let WASM_VECTOR_LEN = 0;
  const cachedTextEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : {
    encode: () => {
      throw Error('TextEncoder not available');
    }
  };
  const encodeString = typeof cachedTextEncoder.encodeInto === 'function' ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
  } : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length
    };
  };
  function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
      const buf = cachedTextEncoder.encode(arg);
      const ptr = malloc(buf.length, 1) >>> 0;
      getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
      WASM_VECTOR_LEN = buf.length;
      return ptr;
    }
    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;
    const mem = getUint8Memory0();
    let offset = 0;
    for (; offset < len; offset++) {
      const code = arg.charCodeAt(offset);
      if (code > 0x7F) break;
      mem[ptr + offset] = code;
    }
    if (offset !== len) {
      if (offset !== 0) {
        arg = arg.slice(offset);
      }
      ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
      const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
      const ret = encodeString(arg, view);
      offset += ret.written;
      ptr = realloc(ptr, len, offset, 1) >>> 0;
    }
    WASM_VECTOR_LEN = offset;
    return ptr;
  }
  let cachedInt32Memory0 = null;
  function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
      cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
  }
  /**
  * @param {number} cols
  * @param {number} rows
  * @param {number} scrollback_limit
  * @returns {Vt}
  */
  function create(cols, rows, scrollback_limit) {
    const ret = wasm.create(cols, rows, scrollback_limit);
    return Vt.__wrap(ret);
  }
  let cachedUint32Memory0 = null;
  function getUint32Memory0() {
    if (cachedUint32Memory0 === null || cachedUint32Memory0.byteLength === 0) {
      cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory0;
  }
  function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32Memory0().subarray(ptr / 4, ptr / 4 + len);
  }
  const VtFinalization = typeof FinalizationRegistry === 'undefined' ? {
    register: () => {},
    unregister: () => {}
  } : new FinalizationRegistry(ptr => wasm.__wbg_vt_free(ptr >>> 0));
  /**
  */
  class Vt {
    static __wrap(ptr) {
      ptr = ptr >>> 0;
      const obj = Object.create(Vt.prototype);
      obj.__wbg_ptr = ptr;
      VtFinalization.register(obj, obj.__wbg_ptr, obj);
      return obj;
    }
    __destroy_into_raw() {
      const ptr = this.__wbg_ptr;
      this.__wbg_ptr = 0;
      VtFinalization.unregister(this);
      return ptr;
    }
    free() {
      const ptr = this.__destroy_into_raw();
      wasm.__wbg_vt_free(ptr);
    }
    /**
    * @param {string} s
    * @returns {any}
    */
    feed(s) {
      const ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len0 = WASM_VECTOR_LEN;
      const ret = wasm.vt_feed(this.__wbg_ptr, ptr0, len0);
      return takeObject(ret);
    }
    /**
    * @param {number} cols
    * @param {number} rows
    * @returns {any}
    */
    resize(cols, rows) {
      const ret = wasm.vt_resize(this.__wbg_ptr, cols, rows);
      return takeObject(ret);
    }
    /**
    * @returns {string}
    */
    inspect() {
      let deferred1_0;
      let deferred1_1;
      try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.vt_inspect(retptr, this.__wbg_ptr);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
      } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
      }
    }
    /**
    * @returns {Uint32Array}
    */
    getSize() {
      try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.vt_getSize(retptr, this.__wbg_ptr);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v1 = getArrayU32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 4, 4);
        return v1;
      } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
      }
    }
    /**
    * @param {number} n
    * @returns {any}
    */
    getLine(n) {
      const ret = wasm.vt_getLine(this.__wbg_ptr, n);
      return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    getCursor() {
      const ret = wasm.vt_getCursor(this.__wbg_ptr);
      return takeObject(ret);
    }
  }
  async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
      if (typeof WebAssembly.instantiateStreaming === 'function') {
        try {
          return await WebAssembly.instantiateStreaming(module, imports);
        } catch (e) {
          if (module.headers.get('Content-Type') != 'application/wasm') {
            console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
          } else {
            throw e;
          }
        }
      }
      const bytes = await module.arrayBuffer();
      return await WebAssembly.instantiate(bytes, imports);
    } else {
      const instance = await WebAssembly.instantiate(module, imports);
      if (instance instanceof WebAssembly.Instance) {
        return {
          instance,
          module
        };
      } else {
        return instance;
      }
    }
  }
  function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_object_drop_ref = function (arg0) {
      takeObject(arg0);
    };
    imports.wbg.__wbindgen_error_new = function (arg0, arg1) {
      const ret = new Error(getStringFromWasm0(arg0, arg1));
      return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_clone_ref = function (arg0) {
      const ret = getObject(arg0);
      return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_number_new = function (arg0) {
      const ret = arg0;
      return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_bigint_from_u64 = function (arg0) {
      const ret = BigInt.asUintN(64, arg0);
      return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_string_new = function (arg0, arg1) {
      const ret = getStringFromWasm0(arg0, arg1);
      return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_f975102236d3c502 = function (arg0, arg1, arg2) {
      getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
    };
    imports.wbg.__wbg_new_b525de17f44a8943 = function () {
      const ret = new Array();
      return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_f841cc6f2098f4b5 = function () {
      const ret = new Map();
      return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_f9876326328f45ed = function () {
      const ret = new Object();
      return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_string = function (arg0) {
      const ret = typeof getObject(arg0) === 'string';
      return ret;
    };
    imports.wbg.__wbg_set_17224bc548dd1d7b = function (arg0, arg1, arg2) {
      getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
    };
    imports.wbg.__wbg_set_388c4c6422704173 = function (arg0, arg1, arg2) {
      const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
      return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_debug_string = function (arg0, arg1) {
      const ret = debugString(getObject(arg1));
      const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len1 = WASM_VECTOR_LEN;
      getInt32Memory0()[arg0 / 4 + 1] = len1;
      getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbindgen_throw = function (arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1));
    };
    return imports;
  }
  function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedInt32Memory0 = null;
    cachedUint32Memory0 = null;
    cachedUint8Memory0 = null;
    return wasm;
  }
  function initSync(module) {
    if (wasm !== undefined) return wasm;
    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
      module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
  }
  async function __wbg_init(input) {
    if (wasm !== undefined) return wasm;
    const imports = __wbg_get_imports();
    if (typeof input === 'string' || typeof Request === 'function' && input instanceof Request || typeof URL === 'function' && input instanceof URL) {
      input = fetch(input);
    }
    const {
      instance,
      module
    } = await __wbg_load(await input, imports);
    return __wbg_finalize_init(instance, module);
  }

  var exports$1 = /*#__PURE__*/Object.freeze({
      __proto__: null,
      Vt: Vt,
      create: create,
      default: __wbg_init,
      initSync: initSync
  });

  const base64codes = [62,0,0,0,63,52,53,54,55,56,57,58,59,60,61,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,0,0,0,0,0,0,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51];

          function getBase64Code(charCode) {
              return base64codes[charCode - 43];
          }

          function base64_decode(str) {
              let missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0;
              let n = str.length;
              let result = new Uint8Array(3 * (n / 4));
              let buffer;

              for (let i = 0, j = 0; i < n; i += 4, j += 3) {
                  buffer =
                      getBase64Code(str.charCodeAt(i)) << 18 |
                      getBase64Code(str.charCodeAt(i + 1)) << 12 |
                      getBase64Code(str.charCodeAt(i + 2)) << 6 |
                      getBase64Code(str.charCodeAt(i + 3));
                  result[j] = buffer >> 16;
                  result[j + 1] = (buffer >> 8) & 0xFF;
                  result[j + 2] = buffer & 0xFF;
              }

              return result.subarray(0, result.length - missingOctets);
          }

          const wasm_code = base64_decode("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QQhrIgAgA08NAQwDCyAHQQhrIQALA0AgBkEEaigCACIJQYqUqNAAc0GBgoQIayAJQX9zcSAGKAIAIglBipSo0ABzQYGChAhrIAlBf3NxckGAgYKEeHENAiAGQQhqIQYgACADQQhqIgNPDQALDAELIAIgBEYEQCACIQQMBAtBACEAA0AgACAFai0AAEEKRg0CIAcgAEEBaiIARw0ACyACIQQMAwsgAyAHRgRAIAIhBAwDCwNAIAMgBWotAABBCkYEQCADIQAMAgsgByADQQFqIgNHDQALIAIhBAwCCyAAIARqIgZBAWohBAJAIAIgBk0NACAAIAVqLQAAQQpHDQBBACEFIAQiBiEADAMLIAIgBE8NAAsLQQEhBSACIgAgCCIGRw0AQQAPCwJAIAwtAABFDQAgC0H49MAAQQQgCigCDBEBAEUNAEEBDwsgACAIayEHQQAhAyAAIAhHBEAgACANai0AAEEKRiEDCyABIAhqIQAgDCADOgAAIAYhCCALIAAgByAKKAIMEQEAIgAgBXJFDQALIAAL0gYBBX8jAEHAAWsiAiQAIAAoAgAhAyACQbgBakGojMAANgIAIAJBBGoiAEGsAWpBxJDAADYCACAAQaQBakG0kMAANgIAIABBnAFqQbSQwAA2AgAgAkGYAWpBmI7AADYCACACQZABakGYjsAANgIAIAJBiAFqQaSPwAA2AgAgAkGAAWpBpJDAADYCACAAQfQAakGkj8AANgIAIAJB8ABqQaSPwAA2AgAgAkHoAGpBpI/AADYCACAAQdwAakGkj8AANgIAIAJB2ABqQZSQwAA2AgAgAkHQAGpBmI7AADYCACACQcgAakGEkMAANgIAIAJBQGtBiI/AADYCACACQThqQfSPwAA2AgAgAkEwakHkj8AANgIAIABBJGpB1I/AADYCACACQSBqQcSPwAA2AgAgAkEYakHEj8AANgIAIAJBEGpBmI7AADYCACACIANB3ABqNgKsASACIANBiAFqNgKkASACIANB9ABqNgKcASACIANBrAFqNgKUASACIANBqAFqNgKMASACIANBwgFqNgKEASACIANBwQFqNgJ8IAIgA0HAAWo2AnQgAiADQb8BajYCbCACIANBvgFqNgJkIAIgA0G9AWo2AlwgAiADQdAAajYCVCACIANBpAFqNgJMIAIgA0GwAWo2AkQgAiADQbIB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amohAiADQSBqIQMgCCAHQQRqIgdHDQALCyAGBEAgB0EDdCAFakEEaiEDA0AgAygCACACaiECIANBCGohAyAGQQFrIgYNAAsLIAEoAgwEQCACQQBIDQEgBSgCBEUgAkEQSXENASACQQF0IQILIAINAQtBASEDQQAhAgwBCyACQQBIDQFBqYzBAC0AABogAkEBENcBIgNFDQILIARBADYCCCAEIAM2AgQgBCACNgIAIARBhO/AACABEBhFDQJB5O/AAEEzIARBD2pBmPDAAEHA8MAAEF0ACxCpAQALQQEgAkHkjMEAKAIAIgBB5AAgABsRAgAACyAAIAQpAgA3AgAgAEEIaiAEQQhqKAIANgIAIARBEGokAAvVAgEHf0EBIQkCQAJAIAJFDQAgASACQQF0aiEKIABBgP4DcUEIdiELIABB/wFxIQ0DQCABQQJqIQwgByABLQABIgJqIQggCyABLQAAIgFHBEAgASALSw0CIAghByAKIAwiAUYNAgwBCwJAAkAgByAITQRAIAQgCEkNASADIAdqIQEDQCACRQ0DIAJBAWshAiABLQAAIAFBAWohASANRw0AC0EAIQkMBQsgByAIQbj5wAAQ7AEACyAIIARBuPnAABDqAQALIAghByAKIAwiAUcNAAsLIAZFDQAgBSAGaiEDIABB//8DcSEBA0AgBUEBaiEAAkAgBS0AACICwCIEQQBOBEAgACEFDAELIAAgA0cEQCAFLQABIARB/wBxQQh0ciECIAVBAmohBQwBC0Go+cAAEO4BAAsgASACayIBQQBIDQEgCUEBcyEJIAMgBUcNAAsLIAlBAXEL8wIBBH8gACgCDCECAkACQCABQYACTwRAIAAoAhghAwJAAkAgACACRgRAIABBFEEQIAAoAhQiAhtqKAIAIgENAUEAIQIMAgsgACgCCCIBIAI2AgwgAiABNgIIDAELIABBFGogAEEQaiACGyEEA0AgBCEFIAEiAigCFCEBIAJBFGogAkEQaiABGyEEIAJBFEEQIAEbaigCACIBDQALIAVBADYCAAsgA0UNAiAAIAAoAhxBAnRB+IzBAGoiASgCAEcEQCADQRBBFCADKAIQIABGG2ogAjYCACACRQ0DDAILIAEgAjYCACACDQFBlJDBAEGUkMEAKAIAQX4gACgCHHdxNgIADAILIAIgACgCCCIARwRAIAAgAjYCDCACIAA2AggPC0GQkMEAQZCQwQAoAgBBfiABQQN2d3E2AgAPCyACIAM2AhggACgCECIBBEAgAiABNgIQIAEgAjYCGAsgACgCFCIARQ0AIAIgADYCFCAAIAI2AhgLC4EDAgV/AX4jAEFAaiIFJABBASEHAkAgAC0ABA0AIAAtAAUhCCAAKAIAIgYoAhwiCUEEcUUEQCAGKAIUQf/0wABB/PTAACAIG0ECQQMgCBsgBigCGCgCDBEBAA0BIAYoAhQgASACIAYoAhgoAgwRAQANASAGKAIUQcz0wABBAiAGKAIYKAIMEQEADQEgAyAGIAQoAgwRAAAhBwwBCyAIRQRAIAYoAhRBgfXAAEEDIAYoAhgoAgwRAQANASAGKAIcIQkLIAVBAToAGyAFIAYpAhQ3AgwgBUHg9MAANgI0IAUgBUEbajYCFCAFIAYpAgg3AiQgBikCACEKIAUgCTYCOCAFIAYoAhA2AiwgBSAGLQAgOgA8IAUgCjcCHCAFIAVBDGoiBjYCMCAGIAEgAhAZDQAgBUEMakHM9MAAQQIQGQ0AIAMgBUEcaiAEKAIMEQAADQAgBSgCMEGE9cAAQQIgBSgCNCgCDBEBACEHCyAAQQE6AAUgACAHOgAEIAVBQGskACAAC+oDAQV/IwBBMGsiBSQAIAIgAWsiCCADSyEJIAJBAWsiBiAAKAIcIgdBAWtJBEAgACAGQYymwAAQiAFBADoADAsgAyAIIAkbIQMCQAJAIAFFBEAgAiAHRg0BIAAoAhghBiAFQSBqIgFBDGogBEEIai8AADsBACAFQSA2AiAgBSAEKQAANwIkIAVBEGogASAGEFEgBUEAOgAcIAMEQCAAQQxqIQQgACgCFCACaiAAKAIcayECA0AgBUEgaiIBIAVBEGoQXiAFQQA6ACwgBCgCCCIHIAQoAgBGBEAgBCAHQQEQhQELIAQoAgQgAkEEdGohBgJAIAIgB08EQCACIAdGDQEgAiAHEGYACyAGQRBqIAYgByACa0EEdBCGAgsgBiABKQIANwIAIAQgB0EBajYCCCAGQQhqIAFBCGopAgA3AgAgA0EBayIDDQALCyAFKAIQIgFFDQIgBSgCFCABQQR0QQQQ5AEMAgsgACABQQFrQZymwAAQiAFBADoADCAFQQhqIAAgASACQaymwAAQYCAFKAIIIQYgBSgCDCIBIANJBEBBlKjAAEEjQYSpwAAQnAEACyADIAYgA0EEdGogASADaxASIAAgAiADayACIAQQSwwBCyAAIAMgACgCGBBxCyAAQQE6ACAgBUEwaiQAC4YEAQV/IwBBEGsiAyQAAkACfwJAIAFBgAFPBEAgA0EANgIMIAFBgBBJDQEgAUGAgARJBEAgAyABQT9xQYABcjoADiADIAFBDHZB4AFyOgAMIAMgAUEGdkE/cUGAAXI6AA1BAwwDCyADIAFBP3FBgAFyOgAPIAMgAUEGdkE/cUGAAXI6AA4gAyABQQx2QT9xQYABcjoADSADIAFBEnZBB3FB8AFyOgAMQQQMAgsgACgCCCICIAAoAgBGBEAjAEEgayIEJAACQAJAIAJBAWoiAkUNACAAKAIAIgVBAXQiBiACIAIgBkkbIgJBCCACQQhLGyICQX9zQR92IQYgBCAFBH8gBCAFNgIcIAQgACgCBDYCFEEBBUEACzYCGCAEQQhqIAYgAiAEQRRqEEkgBCgCCARAIAQoAgwiAEUNASAAIAQoAhBB5IzBACgCACIAQeQAIAAbEQIAAAsgBCgCDCEFIAAgAjYCACAAIAU2AgQgBEEgaiQADAELEKkBAAsgACgCCCECCyAAIAJBAWo2AgggACgCBCACaiABOgAADAILIAMgAUE/cUGAAXI6AA0gAyABQQZ2QcABcjoADEECCyEBIAEgACgCACAAKAIIIgJrSwRAIAAgAiABED0gACgCCCECCyAAKAIEIAJqIANBDGogARCIAhogACABIAJqNgIICyADQRBqJABBAAvAAgIFfwF+IwBBMGsiBCQAQSchAgJAIABCkM4AVARAIAAhBwwBCwNAIARBCWogAmoiA0EEayAAIABCkM4AgCIHQpDOAH59pyIFQf//A3FB5ABuIgZBAXRBvvXAAGovAAA7AAAgA0ECayAFIAZB5ABsa0H//wNxQQF0Qb71wABqLwAAOwAAIAJBBGshAiAAQv/B1y9WIAchAA0ACwsgB6ciA0HjAEsEQCAHpyIFQf//A3FB5ABuIQMgAkECayICIARBCWpqIAUgA0HkAGxrQf//A3FBAXRBvvXAAGovAAA7AAALAkAgA0EKTwRAIAJBAmsiAiAEQQlqaiADQQF0Qb71wABqLwAAOwAADAELIAJBAWsiAiAEQQlqaiADQTByOgAACyABQdjxwABBACAEQQlqIAJqQScgAmsQFSAEQTBqJAALxgIBAX8CQAJAAkACQCAAKAIAIgBB/wBPBEAgAEGgAUkNASAAQQ12QYCuwABqLQAAIgFBFU8NAyAAQQd2QT9xIAFBBnRyQYCwwABqLQAAIgFBtAFPDQQgAEECdkEfcSABQQV0ckHAusAAai0AACAAQQF0QQZxdkEDcSIBQQNHDQICQAJAIABBjfwDTARAIABB3AtGBEBBAQ8LIABB2C9GDQJBASEBIABBkDRHDQEMBQsCQCAAQY78A2sOAgQEAAtBASEBIABBg5gERg0EC0EBQQFBAUEBQQFBAiAAQYAva0EwSRsgAEGiDGtB4QRJGyAAQbHaAGtBP0kbIABB/v//AHFB/MkCRhsgAEHm4wdrQRpJGw8LQQMPC0EBIQEgAEEfSw0BC0EAIQELIAEPCyABQRVBvKLAABBnAAsgAUG0AUHMosAAEGcAC8QCAQR/IABCADcCECAAAn9BACABQYACSQ0AGkEfIAFB////B0sNABogAUEGIAFBCHZnIgNrdkEBcSADQQF0a0E+agsiAjYCHCACQQJ0QfiMwQBqIQRBASACdCIDQZSQwQAoAgBxRQRAIAQgADYCACAAIAQ2AhggACAANgIMIAAgADYCCEGUkMEAQZSQwQAoAgAgA3I2AgAPCwJAAkAgASAEKAIAIgMoAgRBeHFGBEAgAyECDAELIAFBAEEZIAJBAXZrIAJBH0YbdCEFA0AgAyAFQR12QQRxakEQaiIEKAIAIgJFDQIgBUEBdCEFIAIhAyACKAIEQXhxIAFHDQALCyACKAIIIgEgADYCDCACIAA2AgggAEEANgIYIAAgAjYCDCAAIAE2AggPCyAEIAA2AgAgACADNgIYIAAgADYCDCAAIAA2AggLyQ0CCn8BfiMAQRBrIgIkAEEBIQsCQAJAIAEoAhQiCUEnIAEoAhgoAhAiChEAAA0AIAAoAgAhAyMAQSBrIgQkAAJAAkACQAJAAkACQAJAAkACQAJAAkACQCADDigGAQEBAQEBAQECBAEBAwEBAQEBAQEBAQEBAQEBAQEBAQEBCAEBAQEHAAsgA0HcAEYNBAsgA0GAAUkNBiADQQt0IQVBISEAQSEhBwJAA0AgAEEBdiAGaiIBQQJ0QcyFwQBqKAIAQQt0IgAgBUcEQCABIAcgACAFSxsiByABQQFqIAYgACAFSRsiBmshACAGIAdJDQEMAgsLIAFBAWohBgsCQAJAIAZBIE0EQCAGQQJ0IgBBzIXBAGooAgBB1wUhBwJAIAZBIEYNACAAQdCFwQBqIgBFDQAgACgCAEEVdiEHC0EVdiEBIAYEfyAGQQJ0QciFwQBqKAIAQf///wBxBUEACyEAAkAgByABQX9zakUNACADIABrIQUgAUHXBSABQdcFSxshCCAHQQFrIQBBACEGA0AgASAIRg0DIAUgBiABQdCGwQBqLQAAaiIGSQ0BIAAgAUEBaiIBRw0ACyAAIQELIAFBAXEhAAwCCyAGQSFB7ITBABBnAAsgCEHXBUH8hMEAEGcACyAARQ0GIARBGGpBADoAACAEQQA7ARYgBEH9ADoAHyAEIANBD3FB9PHAAGotAAA6AB4gBCADQQR2QQ9xQfTxwABqLQAAOgAdIAQgA0EIdkEPcUH08cAAai0AADoAHCAEIANBDHZBD3FB9PHAAGotAAA6ABsgBCADQRB2QQ9xQfTxwABqLQAAOgAaIAQgA0EUdkEPcUH08cAAai0AADoAGSADQQFyZ0ECdkECayIFQQtPDQcgBEEWaiIBIAVqIgBBuIXBAC8AADsAACAAQQJqQbqFwQAtAAA6AAAgBEEQaiABQQhqLwEAIgA7AQAgBCAEKQEWIgw3AwggAkEIaiAAOwEAIAIgDDcCACACQQo6AAsgAiAFOgAKDAkLIAJBgAQ7AQogAkIANwECIAJB3OgBOwEADAgLIAJBgAQ7AQogAkIANwECIAJB3OQBOwEADAcLIAJBgAQ7AQogAkIANwECIAJB3NwBOwEADAYLIAJBgAQ7AQogAkIANwECIAJB3LgBOwEADAULIAJBgAQ7AQogAkIANwECIAJB3OAAOwEADAQLIAJBgAQ7AQogAkIANwECIAJB3M4AOwEADAMLAn8CQCADQSBJDQACQAJ/QQEgA0H/AEkNABogA0GAgARJDQECQCADQYCACE8EQCADQbDHDGtB0LorSQ0EIANBy6YMa0EFSQ0EIANBnvQLa0HiC0kNBCADQeHXC2tBnxhJDQQgA0GinQtrQQ5JDQQgA0F+cUGe8ApGDQQgA0FgcUHgzQpHDQEMBAsgA0HI+cAAQSxBoPrAAEHEAUHk+8AAQcIDEB8MBAtBACADQbruCmtBBkkNABogA0GAgMQAa0Hwg3RJCwwCCyADQab/wABBKEH2/8AAQZ8CQZWCwQBBrwIQHwwBC0EACwRAIAIgAzYCBCACQYABOgAADAMLIARBGGpBADoAACAEQQA7ARYgBEH9ADoAHyAEIANBD3FB9PHAAGotAAA6AB4gBCADQQR2QQ9xQfTxwABqLQAAOgAdIAQgA0EIdkEPcUH08cAAai0AADoAHCAEIANBDHZBD3FB9PHAAGotAAA6ABsgBCADQRB2QQ9xQfTxwABqLQAAOgAaIAQgA0EUdkEPcUH08cAAai0AADoAGSADQQFyZ0ECdkECayIFQQtPDQEgBEEWaiIBIAVqIgBBuIXBAC8AADsAACAAQQJqQbqFwQAtAAA6AAAgBEEQaiABQQhqLwEAIgA7AQAgBCAEKQEWIgw3AwggAkEIaiAAOwEAIAIgDDcCACACQQo6AAsgAiAFOgAKDAILIAVBCkGohcEAEOkBAAsgBUEKQaiFwQAQ6QEACyAEQSBqJAACQCACLQAAQYABRgRAIAJBCGohBUGAASEIA0ACQCAIQYABRwRAIAItAAoiACACLQALTw0EIAIgAEEBajoACiAAQQpPDQYgACACai0AACEBDAELQQAhCCAFQQA2AgAgAigCBCEBIAJCADcDAAsgCSABIAoRAABFDQALDAILIAItAAoiAUEKIAFBCksbIQAgASACLQALIgUgASAFSxshBwNAIAEgB0YNASACIAFBAWoiBToACiAAIAFGDQMgASACaiEIIAUhASAJIAgtAAAgChEAAEUNAAsMAQsgCUEnIAoRAAAhCwsgAkEQaiQAIAsPCyAAQQpBvIXBABBnAAvMAgACQAJAAkACQAJAAkACQCADQQFrDgYAAQIDBAUGCyAAKAIYIQMgACACQbylwAAQiAEiBEEAOgAMIAQgASADIAUQVCAAIAJBAWogACgCHCAFEEsPCyAAKAIYIQMgACACQcylwAAQiAFBACABQQFqIgEgAyABIANJGyAFEFQgAEEAIAIgBRBLDwsgAEEAIAAoAhwgBRBLDwsgACgCGCEDIAAgAkHcpcAAEIgBIgAgASADIAUQVCAAQQA6AAwPCyAAKAIYIQMgACACQeylwAAQiAFBACABQQFqIgAgAyAAIANJGyAFEFQPCyAAKAIYIQEgACACQfylwAAQiAEiAEEAIAEgBRBUIABBADoADA8LIAAoAhghAyAAIAJBrKXAABCIASIAIAEgASAEIAMgAWsiASABIARLG2oiASAFEFQgASADRgRAIABBADoADAsLlAIBA38jAEEQayICJAACQAJ/AkAgAUGAAU8EQCACQQA2AgwgAUGAEEkNASABQYCABEkEQCACIAFBDHZB4AFyOgAMIAIgAUEGdkE/cUGAAXI6AA1BAiEDQQMMAwsgAiABQQZ2QT9xQYABcjoADiACIAFBDHZBP3FBgAFyOgANIAIgAUESdkEHcUHwAXI6AAxBAyEDQQQMAgsgACgCCCIEIAAoAgBGBH8gACAEEIIBIAAoAggFIAQLIAAoAgRqIAE6AAAgACAAKAIIQQFqNgIIDAILIAIgAUEGdkHAAXI6AAxBASEDQQILIQQgAyACQQxqIgNyIAFBP3FBgAFyOgAAIAAgAyADIARqEI4BCyACQRBqJABBAAulAgEGfyMAQRBrIgIkAAJAAkAgASgCECIFIAAoAgAgACgCCCIDa0sEQCAAIAMgBRCFASAAKAIIIQMgACgCBCEEIAJBCGogAUEMaigCADYCACACIAEpAgQ3AwAMAQsgACgCBCEEIAJBCGogAUEMaigCADYCACACIAEpAgQ3AwAgBUUNAQsCQCABKAIAIgZBgIDEAEYNACAEIANBBHRqIgEgBjYCACABIAIpAwA3AgQgAUEMaiACQQhqIgcoAgA2AgAgBUEBayIERQRAIANBAWohAwwBCyADIAVqIQMgAUEUaiEBA0AgAUEEayAGNgIAIAEgAikDADcCACABQQhqIAcoAgA2AgAgAUEQaiEBIARBAWsiBA0ACwsgACADNgIICyACQRBqJAALoQUBCn8jAEEwayIGJAAgBkEAOwAOIAZBAjoACiAGQQI6AAYgBkEsaiAFIAZBBmogBRsiBUEIai8AADsBACAGQSA2AiAgBiAFKQAANwIkIAZBEGoiCSAGQSBqIgwgARBRIAZBADoAHCMAQRBrIgokAAJAAkACQAJAIAJFBEBBBCEHDAELIAJB////P0sNAUGpjMEALQAAGiACQQR0IgVBBBDXASIHRQ0CCyAKQQRqIgVBCGoiDkEANgIAIAogBzYCCCAKIAI2AgQjAEEQayILJAAgAiAFKAIAIAUoAggiB2tLBEAgBSAHIAIQhQEgBSgCCCEHCyAFKAIEIAdBBHRqIQgCQAJAIAJBAk8EQCACQQFrIQ0gCS0ADCEPA0AgCyAJEF4gCCAPOgAMIAhBCGogC0EIaigCADYCACAIIAspAwA3AgAgCEEQaiEIIA1BAWsiDQ0ACyACIAdqQQFrIQcMAQsgAg0AIAUgBzYCCCAJKAIAIgVFDQEgCSgCBCAFQQR0QQQQ5AEMAQsgCCAJKQIANwIAIAUgB0EBajYCCCAIQQhqIAlBCGopAgA3AgALIAtBEGokACAMQQhqIA4oAgA2AgAgDCAKKQIENwIAIApBEGokAAwCCxCpAQALQQQgBUHkjMEAKAIAIgBB5AAgABsRAgAACwJAAkAgA0EBRgRAIARFDQEgBigCICAGKAIoIgVrIARPDQEgBkEgaiAFIAQQhQEMAQsgBigCICAGKAIoIgVrQecHTQRAIAZBIGogBUHoBxCFAQsgAw0ADAELIARBCm4gBGohBQsgACAGKQIgNwIMIAAgAjYCHCAAIAE2AhggAEEAOgAgIAAgBTYCCCAAIAQ2AgQgACADNgIAIABBFGogBkEoaigCADYCACAGQTBqJAALvgICBH8BfiMAQUBqIgMkAEEBIQUCQCAALQAEDQAgAC0ABSEFAkAgACgCACIEKAIcIgZBBHFFBEAgBUUNAUEBIQUgBCgCFEH/9MAAQQIgBCgCGCgCDBEBAEUNAQwCCyAFRQRAQQEhBSAEKAIUQY31wABBASAEKAIYKAIMEQEADQIgBCgCHCEGC0EBIQUgA0EBOgAbIAMgBCkCFDcCDCADQeD0wAA2AjQgAyADQRtqNgIUIAMgBCkCCDcCJCAEKQIAIQcgAyAGNgI4IAMgBCgCEDYCLCADIAQtACA6ADwgAyAHNwIcIAMgA0EMajYCMCABIANBHGogAigCDBEAAA0BIAMoAjBBhPXAAEECIAMoAjQoAgwRAQAhBQwBCyABIAQgAigCDBEAACEFCyAAQQE6AAUgACAFOgAEIANBQGskAAuRAgEDfyMAQRBrIgIkAAJAAn8CQCABQYABTwRAIAJBADYCDCABQYAQSQ0BIAFBgIAESQRAIAIgAUEMdkHgAXI6AAwgAiABQQZ2QT9xQYABcjoADUECIQNBAwwDCyACIAFBBnZBP3FBgAFyOgAOIAIgAUEMdkE/cUGAAXI6AA0gAiABQRJ2QQdxQfABcjoADEEDIQNBBAwCCyAAKAIIIgQgACgCAEYEfyAAIAQQggEgACgCCAUgBAsgACgCBGogAToAACAAIAAoAghBAWo2AggMAgsgAiABQQZ2QcABcjoADEEBIQNBAgshBCADIAJBDGoiA3IgAUE/cUGAAXI6AAAgACADIAQQ2wELIAJBEGokAEEAC7sCAgR/AX4jAEFAaiIDJAAgACgCACEFIAACf0EBIAAtAAgNABogACgCBCIEKAIcIgZBBHFFBEBBASAEKAIUQf/0wABBifXAACAFG0ECQQEgBRsgBCgCGCgCDBEBAA0BGiABIAQgAigCDBEAAAwBCyAFRQRAQQEgBCgCFEGK9cAAQQIgBCgCGCgCDBEBAA0BGiAEKAIcIQYLIANBAToAGyADIAQpAhQ3AgwgA0Hg9MAANgI0IAMgA0EbajYCFCADIAQpAgg3AiQgBCkCACEHIAMgBjYCOCADIAQoAhA2AiwgAyAELQAgOgA8IAMgBzcCHCADIANBDGo2AjBBASABIANBHGogAigCDBEAAA0AGiADKAIwQYT1wABBAiADKAI0KAIMEQEACzoACCAAIAVBAWo2AgAgA0FAayQAIAAL5AIBB38jAEEwayIDJAAgAigCBCEEIANBIGogASACKAIIIgEQxwECfwJAIAMoAiAEQCADQRhqIANBKGooAgA2AgAgAyADKQIgNwMQIAFBAnQhAgJAA0AgAkUNASACQQRrIQIgAyAENgIgIARBBGohBCADQQhqIQYjAEEQayIBJAAgA0EQaiIFKAIIIQcgAUEIaiAFKAIAIANBIGooAgA1AgAQUiABKAIMIQggASgCCCIJRQRAIAVBBGogByAIEOYBIAUgB0EBajYCCAsgBiAJNgIAIAYgCDYCBCABQRBqJAAgAygCCEUNAAsgAygCDCEEIAMoAhQiAUGEAUkNAiABEAAMAgsgA0EgaiIBQQhqIANBGGooAgA2AgAgAyADKQMQNwMgIAMgASgCBDYCBCADQQA2AgAgAygCBCEEIAMoAgAMAgsgAygCJCEEC0EBCyEBIAAgBDYCBCAAIAE2AgAgA0EwaiQAC/wBAQR/IAAoAgQhAiAAQZCkwAA2AgQgACgCACEBIABBkKTAADYCACAAKAIIIQMCQAJAIAEgAkYEQCAAKAIQIgFFDQEgACgCDCICIAMoAggiAEYNAiADKAIEIgQgAEEEdGogBCACQQR0aiABQQR0EIYCDAILIAIgAWtBBHYhAgNAIAEoAgAiBARAIAFBBGooAgAgBEEEdEEEEOQBCyABQRBqIQEgAkEBayICDQALIAAoAhAiAUUNACAAKAIMIgIgAygCCCIARwRAIAMoAgQiBCAAQQR0aiAEIAJBBHRqIAFBBHQQhgILIAMgACABajYCCAsPCyADIAAgAWo2AggLigICBH8BfiMAQTBrIgIkACABKAIAQYCAgIB4RgRAIAEoAgwhAyACQSRqIgRBCGoiBUEANgIAIAJCgICAgBA3AiQgBEHw6sAAIAMQGBogAkEgaiAFKAIAIgM2AgAgAiACKQIkIgY3AxggAUEIaiADNgIAIAEgBjcCAAsgASkCACEGIAFCgICAgBA3AgAgAkEQaiIDIAFBCGoiASgCADYCACABQQA2AgBBqYzBAC0AABogAiAGNwMIQQxBBBDXASIBRQRAQQRBDEHkjMEAKAIAIgBB5AAgABsRAgAACyABIAIpAwg3AgAgAUEIaiADKAIANgIAIABBxO3AADYCBCAAIAE2AgAgAkEwaiQAC9kBAQV/IwBBIGsiAyQAAn9BACACIAJBAWoiAksNABpBBCEEIAEoAgAiBkEBdCIFIAIgAiAFSRsiAkEEIAJBBEsbIgVBAnQhByACQYCAgIACSUECdCECAkAgBkUEQEEAIQQMAQsgAyAGQQJ0NgIcIAMgASgCBDYCFAsgAyAENgIYIANBCGogAiAHIANBFGoQSCADKAIIRQRAIAMoAgwhAiABIAU2AgAgASACNgIEQYGAgIB4DAELIAMoAhAhASADKAIMCyEEIAAgATYCBCAAIAQ2AgAgA0EgaiQAC9kBAQR/IwBBIGsiBCQAAn9BACACIAIgA2oiAksNABpBBCEDIAEoAgAiBkEBdCIFIAIgAiAFSRsiAkEEIAJBBEsbIgVBBHQhByACQYCAgMAASUECdCECAkAgBkUEQEEAIQMMAQsgBCAGQQR0NgIcIAQgASgCBDYCFAsgBCADNgIYIARBCGogAiAHIARBFGoQSCAEKAIIRQRAIAQoAgwhAiABIAU2AgAgASACNgIEQYGAgIB4DAELIAQoAhAhASAEKAIMCyECIAAgATYCBCAAIAI2AgAgBEEgaiQAC9wBAQF/IwBBEGsiFSQAIAAoAhQgASACIAAoAhgoAgwRAQAhASAVQQA6AA0gFSABOgAMIBUgADYCCCAVQQhqIAMgBCAFIAYQISAHIAggCUGYjsAAECEgCiALIAwgDRAhIA4gDyAQIBEQISASIBMgFEGojMAAECEhAQJ/IBUtAAwiAkEARyAVLQANRQ0AGkEBIAINABogASgCACIALQAcQQRxRQRAIAAoAhRBh/XAAEECIAAoAhgoAgwRAQAMAQsgACgCFEGG9cAAQQEgACgCGCgCDBEBAAsgFUEQaiQAC5YDAQZ/IwBBIGsiAyQAIAMgAjYCDCADIANBEGo2AhwCQAJAAkAgASACRg0AA0AgARCLASIEQf//A3FFBEAgAiABQRBqIgFHDQEMAgsLIAMgAUEQajYCCEGpjMEALQAAGkEIQQIQ1wEiAUUNASABIAQ7AQAgA0EQaiIEQQhqIgZBATYCACADIAE2AhQgA0EENgIQIAMoAgghAiADKAIMIQUjAEEQayIBJAAgASAFNgIIIAEgAjYCBCABIAFBDGoiBzYCDAJAIAIgBUYNAANAIAIQiwEiCEH//wNxRQRAIAUgAkEQaiICRg0CDAELIAEgAkEQajYCBCAEKAIIIgIgBCgCAEYEQCAEIAIQhgELIAQgAkEBajYCCCAEKAIEIAJBAXRqIAg7AQAgASAHNgIMIAEoAgQiAiABKAIIIgVHDQALCyABQRBqJAAgAEEIaiAGKAIANgIAIAAgAykCEDcCAAwCCyAAQQA2AgggAEKAgICAIDcCAAwBC0ECQQhB5IzBACgCACIAQeQAIAAbEQIAAAsgA0EgaiQAC5oBAQR/IwBBEGsiAiQAQQEhAwJAAkAgAQRAIAFBAEgNAkGpjMEALQAAGiABQQEQ1wEiA0UNAQsgAkEEaiIEQQhqIgVBADYCACACIAM2AgggAiABNgIEIAQgAUEBEFcgAEEIaiAFKAIANgIAIAAgAikCBDcCACACQRBqJAAPC0EBIAFB5IzBACgCACIAQeQAIAAbEQIAAAsQqQEAC78CAQV/AkACQAJAQX8gACgCnAEiAyABRyABIANJG0H/AXEOAgIBAAsgACgCWCIEBEAgACgCVCEHIAQhAwNAIAcgBEEBdiAFaiIEQQJ0aigCACABSSEGIAMgBCAGGyIDIARBAWogBSAGGyIFayEEIAMgBUsNAAsLIAAgBTYCWAwBCyAAQdAAaiEEQQAgASADQXhxQQhqIgVrIgMgASADSRsiA0EDdiADQQdxQQBHaiIDBEBBACADayEGIAQoAgghAwNAIAQoAgAgA0YEQCAEIAMQgwEgBCgCCCEDCyAEKAIEIANBAnRqIAU2AgAgBCAEKAIIQQFqIgM2AgggBUEIaiEFIAZBAWoiBg0ACwsLIAIgACgCoAFHBEAgAEEANgKoASAAIAJBAWs2AqwBCyAAIAI2AqABIAAgATYCnAEgABBCC4QCAQJ/IwBBIGsiBiQAQfSMwQBB9IzBACgCACIHQQFqNgIAAkACQCAHQQBIDQBBwJDBAC0AAA0AQcCQwQBBAToAAEG8kMEAQbyQwQAoAgBBAWo2AgAgBiAFOgAdIAYgBDoAHCAGIAM2AhggBiACNgIUIAZBjO7AADYCECAGQfDqwAA2AgxB6IzBACgCACICQQBIDQBB6IzBACACQQFqNgIAQeiMwQBB7IzBACgCAAR/IAYgACABKAIQEQIAIAYgBikDADcCDEHsjMEAKAIAIAZBDGpB8IzBACgCACgCFBECAEHojMEAKAIAQQFrBSACCzYCAEHAkMEAQQA6AAAgBA0BCwALAAvLAQEDfyMAQSBrIgQkAAJ/QQAgAiACIANqIgJLDQAaQQEhAyABKAIAIgZBAXQiBSACIAIgBUkbIgJBCCACQQhLGyICQX9zQR92IQUCQCAGRQRAQQAhAwwBCyAEIAY2AhwgBCABKAIENgIUCyAEIAM2AhggBEEIaiAFIAIgBEEUahBIIAQoAghFBEAgBCgCDCEDIAEgAjYCACABIAM2AgRBgYCAgHgMAQsgBCgCECEBIAQoAgwLIQIgACABNgIEIAAgAjYCACAEQSBqJAALzAEBAX8jAEEQayISJAAgACgCFCABIAIgACgCGCgCDBEBACEBIBJBADoADSASIAE6AAwgEiAANgIIIBJBCGogAyAEIAUgBhAhIAcgCCAJIAoQISALQQkgDCANECEgDiAPIBAgERAhIQECfyASLQAMIgJBAEcgEi0ADUUNABpBASACDQAaIAEoAgAiAC0AHEEEcUUEQCAAKAIUQYf1wABBAiAAKAIYKAIMEQEADAELIAAoAhRBhvXAAEEBIAAoAhgoAgwRAQALIBJBEGokAAvRAgEFfyMAQRBrIgUkAAJAAkACQCABIAJGDQADQEEEQRRBAyABLwEEIgNBFEYbIANBBEYbIgNBA0YEQCACIAFBEGoiAUcNAQwCCwtBqYzBAC0AABpBCEECENcBIgRFDQEgBCADOwEAIAVBBGoiA0EIaiIGQQE2AgAgBSAENgIIIAVBBDYCBAJAIAFBEGoiASACRg0AIAFBEGohAQNAQQRBFEEDIAFBDGsvAQAiBEEURhsgBEEERhsiB0EDRwRAIAMoAggiBCADKAIARgRAIAMgBBCGAQsgAyAEQQFqNgIIIAMoAgQgBEEBdGogBzsBAAsgASACRg0BIAFBEGohAQwACwALIABBCGogBigCADYCACAAIAUpAgQ3AgAMAgsgAEEANgIIIABCgICAgCA3AgAMAQtBAkEIQeSMwQAoAgAiAEHkACAAGxECAAALIAVBEGokAAvHAQEBfyMAQRBrIgUkACAFIAAoAhQgASACIAAoAhgoAgwRAQA6AAwgBSAANgIIIAUgAkU6AA0gBUEANgIEIAVBBGogAyAEEC4hACAFLQAMIQECfyABQQBHIAAoAgAiAkUNABpBASABDQAaIAUoAgghAQJAIAJBAUcNACAFLQANRQ0AIAEtABxBBHENAEEBIAEoAhRBjPXAAEEBIAEoAhgoAgwRAQANARoLIAEoAhRB8/HAAEEBIAEoAhgoAgwRAQALIAVBEGokAAvNAQEDfyMAQSBrIgMkAAJAIAEgASACaiIBSw0AQQEhAiAAKAIAIgVBAXQiBCABIAEgBEkbIgFBCCABQQhLGyIBQX9zQR92IQQCQCAFRQRAQQAhAgwBCyADIAU2AhwgAyAAKAIENgIUCyADIAI2AhggA0EIaiAEIAEgA0EUahBJIAMoAggEQCADKAIMIgBFDQEgACADKAIQQeSMwQAoAgAiAEHkACAAGxECAAALIAMoAgwhAiAAIAE2AgAgACACNgIEIANBIGokAA8LEKkBAAvNAQEDfyMAQSBrIgMkAAJAIAEgASACaiIBSw0AQQEhAiAAKAIAIgVBAXQiBCABIAEgBEkbIgFBCCABQQhLGyIBQX9zQR92IQQCQCAFRQRAQQAhAgwBCyADIAU2AhwgAyAAKAIENgIUCyADIAI2AhggA0EIaiAEIAEgA0EUahBEIAMoAggEQCADKAIMIgBFDQEgACADKAIQQeSMwQAoAgAiAEHkACAAGxECAAALIAMoAgwhAiAAIAE2AgAgACACNgIEIANBIGokAA8LEKkBAAvEAQEBfyMAQRBrIg8kACAAKAIUIAEgAiAAKAIYKAIMEQEAIQEgD0EAOgANIA8gAToADCAPIAA2AgggD0EIaiADIAQgBSAGECEgByAIIAkgChAhIAsgDCANIA4QISECIA8tAAwhAQJ/IAFBAEcgDy0ADUUNABpBASABDQAaIAIoAgAiAC0AHEEEcUUEQCAAKAIUQYf1wABBAiAAKAIYKAIMEQEADAELIAAoAhRBhvXAAEEBIAAoAhgoAgwRAQALIA9BEGokAAvSAQEDfyMAQdAAayIAJAAgAEEzNgIMIABBxIrAADYCCCAAQQA2AiggAEKAgICAEDcCICAAQQM6AEwgAEEgNgI8IABBADYCSCAAQdyFwAA2AkQgAEEANgI0IABBADYCLCAAIABBIGo2AkAgAEEIaiIBKAIAIAEoAgQgAEEsahCEAgRAQfSFwABBNyAAQRBqQayGwABBiIfAABBdAAsgAEEQaiIBQQhqIABBKGooAgAiAjYCACAAIAApAiA3AxAgACgCFCACEAEgARDJASAAQdAAaiQAC7UBAQN/IwBBEGsiAiQAIAJCgICAgMAANwIEIAJBADYCDEEAIAFBCGsiBCABIARJGyIBQQN2IAFBB3FBAEdqIgQEQEEIIQEDQCACKAIEIANGBEAgAkEEaiADEIMBIAIoAgwhAwsgAigCCCADQQJ0aiABNgIAIAIgAigCDEEBaiIDNgIMIAFBCGohASAEQQFrIgQNAAsLIAAgAikCBDcCACAAQQhqIAJBDGooAgA2AgAgAkEQaiQAC8MMARJ/IwBBEGsiECQAIAAoApwBIgggACgCGEcEQCAAQQA6AMIBCyAQQQhqIREgACgCoAEhDSAAKAJoIQsgACgCbCEHIwBBQGoiBiQAQQAgACgCFCIDIAAoAhwiCWsgB2oiASADayICIAEgAkkbIQ4gACgCECEMIAAoAhghDwJAIANFDQAgAUUNACADIAdqIAlBf3NqIQQgDEEMaiEFIANBBHRBEGshAQNAIAogD2pBACAFLQAAIgIbIQogDiACQQFzaiEOIARFDQEgBUEQaiEFIARBAWshBCABIgJBEGshASACDQALCwJAIAggD0YNACAKIAtqIQogAEEANgIUIAZBADYCOCAGIAM2AjQgBiAAQQxqIgc2AjAgBiAMIANBBHRqNgIsIAYgDDYCKCAGIAg2AjwgBkGAgICAeDYCGCAGQQxqIQsjAEHQAGsiASQAIAFBGGogBkEYaiIEEBcCQAJAAkAgASgCGEGAgICAeEYEQCALQQA2AgggC0KAgICAwAA3AgAgBBCwAQwBC0GpjMEALQAAGkHAAEEEENcBIgJFDQEgAiABKQIYNwIAIAFBDGoiA0EIaiIPQQE2AgAgAkEIaiABQSBqKQIANwIAIAEgAjYCECABQQQ2AgwgAUEoaiIMIARBKBCIAhojAEEQayICJAAgAiAMEBcgAigCAEGAgICAeEcEQCADKAIIIgRBBHQhBQNAIAMoAgAgBEYEQCADIARBARCFAQsgAyAEQQFqIgQ2AgggAygCBCAFaiISIAIpAgA3AgAgEkEIaiACQQhqKQIANwIAIAIgDBAXIAVBEGohBSACKAIAQYCAgIB4Rw0ACwsgDBCwASACQRBqJAAgC0EIaiAPKAIANgIAIAsgASkCDDcCAAsgAUHQAGokAAwBC0EEQcAAQeSMwQAoAgAiAEHkACAAGxECAAALIAYoAhRBBHQhBCAGKAIQIQUCQANAIARFDQEgBEEQayEEIAUoAgggBUEQaiEFIAhGDQALQcynwABBN0GEqMAAEJwBAAsgBkEgaiIBIAZBFGooAgA2AgAgBiAGKQIMNwMYIAcQigEgBygCACICBEAgACgCECACQQR0QQQQ5AELIAcgBikDGDcCACAHQQhqIAEoAgA2AgAgCSAAKAIUIgNLBEAgACAJIANrIAgQcSAAKAIUIQMLQQAhBAJAIA5FDQAgA0EBayICRQ0AIAAoAhBBDGohBUEAIQEDQAJAIAMgBEcEQCAEQQFqIQQgDiABIAUtAABBAXNqIgFLDQEMAwsgAyADQYynwAAQZwALIAVBEGohBSACIARLDQALCwJAAkAgCCAKSw0AIAQgAyADIARJGyEBIAAoAhAgBEEEdGpBDGohBQNAIAEgBEYNAiAFLQAARQ0BIAVBEGohBSAEQQFqIQQgCiAIayIKIAhPDQALCyAKIAhBAWsiASABIApLGyELIAQgCSADa2oiAUEATiECIAFBACACGyEHIAlBACABIAIbayEJDAELIAEgA0H8psAAEGcACwJAAkACQAJAAkBBfyAJIA1HIAkgDUsbQf8BcQ4CAgABC0EAIAMgCWsiASABIANLGyICIA0gCWsiASABIAJLGyIEQQAgByAJSRsgB2ohByABIAJNDQEgACABIARrIAgQcQwBCyAAQQxqIQIgCSANayIEIAkgB0F/c2oiASABIARLGyIFBEACQCADIAVrIgEgAigCCCIDSw0AIAIgATYCCCABIANGDQAgAyABayEDIAIoAgQgAUEEdGohAQNAIAEoAgAiAgRAIAFBBGooAgAgAkEEdEEEEOQBCyABQRBqIQEgA0EBayIDDQALCyAAKAIUIgFFDQIgACgCECABQQR0akEEa0EAOgAACyAHIARrIAVqIQcLIABBAToAICAAIA02AhwgACAINgIYIBEgBzYCBCARIAs2AgAgBkFAayQADAELQeymwAAQ7gEACyAAIBApAwg3AmggAEHcAGohCAJAIAAoAqABIgEgACgCZCICTQRAIAAgATYCZAwBCyAIIAEgAmtBABBXIAAoAqABIQELIAhBACABEHggACgCnAEiASAAKAJ0TQRAIAAgAUEBazYCdAsgACgCoAEiASAAKAJ4TQRAIAAgAUEBazYCeAsgEEEQaiQAC7oBAQF/IwBBEGsiCyQAIAAoAhQgASACIAAoAhgoAgwRAQAhASALQQA6AA0gCyABOgAMIAsgADYCCCALQQhqIAMgBCAFIAYQISAHIAggCSAKECEhAiALLQAMIQECfyABQQBHIAstAA1FDQAaQQEgAQ0AGiACKAIAIgAtABxBBHFFBEAgACgCFEGH9cAAQQIgACgCGCgCDBEBAAwBCyAAKAIUQYb1wABBASAAKAIYKAIMEQEACyALQRBqJAALsAEBA39BASEEQQQhBgJAIAFFDQAgAkEASA0AAn8CQAJAAn8gAygCBARAIAMoAggiAUUEQCACRQRADAQLQamMwQAtAAAaIAJBARDXAQwCCyADKAIAIAFBASACEM0BDAELIAJFBEAMAgtBqYzBAC0AABogAkEBENcBCyIERQ0BCyAAIAQ2AgRBAAwBCyAAQQE2AgRBAQshBEEIIQYgAiEFCyAAIAZqIAU2AgAgACAENgIAC8MBAQJ/IwBBQGoiAiQAAkAgAQRAIAEoAgAiA0F/Rg0BIAEgA0EBajYCACACQQE2AhQgAkGAhMAANgIQIAJCATcCHCACQQI2AiwgAiABQQRqNgIoIAIgAkEoajYCGCACQTBqIgMgAkEQahAeIAEgASgCAEEBazYCACACQQhqIAMQ2gEgAigCCCEBIAIgAigCDDYCBCACIAE2AgAgAigCBCEBIAAgAigCADYCACAAIAE2AgQgAkFAayQADwsQ/AEACxD9AQALuAEBA38CQCAAKAKEBCIBQX9HBEAgAUEBaiECIAFBIEkNASACQSBB7JnAABDqAQALQeyZwAAQqgEACyAAQQRqIQEgACACQQR0akEEaiEDA0ACQCABKAIAIgJBf0cEQCACQQZJDQEgAkEBakEGQfyewAAQ6gEAC0H8nsAAEKoBAAsgAUEEakEAIAJBAXRBAmoQhwIaIAFBADYCACADIAFBEGoiAUcNAAsgAEGAgMQANgIAIABBADYChAQL5gIBBH8jAEEgayIDJAAgA0EMaiECAkAgAS0AIEUEQCACQQA2AgAMAQsgAUEAOgAgAkAgASgCAARAIAEoAhQiBSABKAIcayIEIAEoAghLDQELIAJBADYCAAwBCyAEIAEoAgRrIgQgBU0EQCABQQA2AhQgAiAENgIMIAIgBSAEazYCECACIAFBDGo2AgggAiABKAIQIgU2AgAgAiAFIARBBHRqNgIEDAELIAQgBUHwmMAAEOoBAAsgAygCDCECAn8CQAJAIAEtALwBRQRAIAINAQwCCyACRQ0BIANBDGoQMAwBC0GpjMEALQAAGkEUQQQQ1wEiAQRAIAEgAykCDDcCACABQRBqIANBDGoiAkEQaigCADYCACABQQhqIAJBCGopAgA3AgBBsKDAAAwCC0EEQRRB5IzBACgCACIAQeQAIAAbEQIAAAtBASEBQZSgwAALIQIgACACNgIEIAAgATYCACADQSBqJAALmgEBAX8gACIEAn8CQAJ/AkACQCABBEAgAkEASA0BIAMoAgQEQCADKAIIIgAEQCADKAIAIAAgASACEM0BDAULCyACRQ0CQamMwQAtAAAaIAIgARDXAQwDCyAEQQA2AgQMAwsgBEEANgIEDAILIAELIgAEQCAEIAI2AgggBCAANgIEQQAMAgsgBCACNgIIIAQgATYCBAtBAQs2AgALmwEBAX8CQAJAIAEEQCACQQBIDQECfyADKAIEBEACQCADKAIIIgRFBEAMAQsgAygCACAEIAEgAhDNAQwCCwsgASACRQ0AGkGpjMEALQAAGiACIAEQ1wELIgMEQCAAIAI2AgggACADNgIEIABBADYCAA8LIAAgAjYCCCAAIAE2AgQMAgsgAEEANgIEDAELIABBADYCBAsgAEEBNgIAC7kBAQR/AkACQCACRQRAIAEoAgAhAyABKAIEIQUMAQsgASgCBCEFIAEoAgAhBANAIAQgBUYNAiABIARBEGoiAzYCACAEKAIAIgYEQCAGQYCAgIB4Rg0DIAQoAgQgBkEEdEEEEOQBCyADIQQgAkEBayICDQALCyADIAVGBEAgAEGAgICAeDYCAA8LIAEgA0EQajYCACAAIAMpAgA3AgAgAEEIaiADQQhqKQIANwIADwsgAEGAgICAeDYCAAv3AgEDfyMAQTBrIgQkACAAKAIYIQUgBEEsaiADQQhqLwAAOwEAIARBIDYCICAEIAMpAAA3AiQgBEEQaiAEQSBqIAUQUSAEQQA6ABwgBEEIaiAAEJoBAkAgASACTQRAIAQoAgwiACACSQ0BIAQoAgggAUEEdGohACAEQRBqIQMjAEEQayIFJAACQCACIAFrIgFFBEAgAygCACIARQ0BIAMoAgQgAEEEdEEEEOQBDAELIAAgAUEBayICQQR0aiEBIAIEQCADLQAMIQIDQCAFIAMQXiAAKAIAIgYEQCAAKAIEIAZBBHRBBBDkAQsgACAFKQMANwIAIAAgAjoADCAAQQhqIAVBCGooAgA2AgAgASAAQRBqIgBHDQALCyABKAIAIgAEQCABKAIEIABBBHRBBBDkAQsgASADKQIANwIAIAFBCGogA0EIaikCADcCAAsgBUEQaiQAIARBMGokAA8LIAEgAkG8p8AAEOwBAAsgAiAAQbynwAAQ6gEAC8gBAQJ/AkACQCAAKAIIIgUgAU8EQCAAKAIEIAFBBHRqIQAgBSABayIEIAJJBEBB3KPAAEEhQYCkwAAQnAEACyAEIAJrIgQgACAEQQR0aiACEBIgASACaiIEIAJJDQEgBCAFSw0CIAIEQCACQQR0IQIDQCAAIAMpAgA3AgAgAEEIaiADQQhqKQIANwIAIABBEGohACACQRBrIgINAAsLDwsgASAFQcCqwAAQ6QEACyABIARB0KrAABDsAQALIAQgBUHQqsAAEOoBAAuOAQEDfyMAQYABayIEJAAgACgCACEAA0AgAiAEakH/AGogAEEPcSIDQTByIANB1wBqIANBCkkbOgAAIAJBAWshAiAAQRBJIABBBHYhAEUNAAsgAkGAAWoiAEGBAU8EQCAAQYABQaz1wAAQ6QEACyABQbz1wABBAiACIARqQYABakEAIAJrEBUgBEGAAWokAAuWAQEDfyMAQYABayIEJAAgAC0AACECQQAhAANAIAAgBGpB/wBqIAJBD3EiA0EwciADQTdqIANBCkkbOgAAIABBAWshACACQf8BcSIDQQR2IQIgA0EQTw0ACyAAQYABaiICQYEBTwRAIAJBgAFBrPXAABDpAQALIAFBvPXAAEECIAAgBGpBgAFqQQAgAGsQFSAEQYABaiQAC5cBAQN/IwBBgAFrIgQkACAALQAAIQJBACEAA0AgACAEakH/AGogAkEPcSIDQTByIANB1wBqIANBCkkbOgAAIABBAWshACACQf8BcSIDQQR2IQIgA0EQTw0ACyAAQYABaiICQYEBTwRAIAJBgAFBrPXAABDpAQALIAFBvPXAAEECIAAgBGpBgAFqQQAgAGsQFSAEQYABaiQAC40BAQN/IwBBgAFrIgQkACAAKAIAIQADQCACIARqQf8AaiAAQQ9xIgNBMHIgA0E3aiADQQpJGzoAACACQQFrIQIgAEEQSSAAQQR2IQBFDQALIAJBgAFqIgBBgQFPBEAgAEGAAUGs9cAAEOkBAAsgAUG89cAAQQIgAiAEakGAAWpBACACaxAVIARBgAFqJAALywIBBn8jAEEQayIGJAACQAJAAkAgAkUEQEEEIQcMAQsgAkH///8/Sw0BQamMwQAtAAAaIAJBBHQiA0EEENcBIgdFDQILIAZBBGoiBEEIaiIIQQA2AgAgBiAHNgIIIAYgAjYCBCACIAQoAgAgBCgCCCIDa0sEQCAEIAMgAhCFASAEKAIIIQMLIAQoAgQgA0EEdGohBQJAAkAgAkECTwRAIAJBAWshBwNAIAUgASkCADcCACAFQQhqIAFBCGopAgA3AgAgBUEQaiEFIAdBAWsiBw0ACyACIANqQQFrIQMMAQsgAkUNAQsgBSABKQIANwIAIAVBCGogAUEIaikCADcCACADQQFqIQMLIAQgAzYCCCAAQQhqIAgoAgA2AgAgACAGKQIENwIAIAZBEGokAA8LEKkBAAtBBCADQeSMwQAoAgAiAEHkACAAGxECAAAL8gMBBn8jAEEwayIFJAAgBSACNwMIIAAhCAJAIAEtAAJFBEAgAkKAgICAgICAEFoEQCAFQQI2AhQgBUHklsAANgIQIAVCATcCHCAFQcUANgIsIAUgBUEoajYCGCAFIAVBCGo2AihBASEBIwBBEGsiAyQAIAVBEGoiACgCDCEEAkACQAJAAkACQAJAAkAgACgCBA4CAAECCyAEDQFBnJbAACEGQQAhAAwCCyAEDQAgACgCACIEKAIEIQAgBCgCACEGDAELIANBBGogABAeIAMoAgwhACADKAIIIQQMAQsgA0EEaiIEAn8gAEUEQCAEQoCAgIAQNwIEQQAMAQsgAEEASARAIARBADYCBEEBDAELQamMwQAtAAAaIABBARDXASIHBEAgBCAHNgIIIAQgADYCBEEADAELIAQgADYCCCAEQQE2AgRBAQs2AgAgAygCBARAIAMoAggiAEUNAiAAIAMoAgxB5IzBACgCACIAQeQAIAAbEQIAAAsgAygCCCEHIAMoAgwiBCAGIAAQiAIhBiADIAA2AgwgAyAGNgIIIAMgBzYCBAsgBCAAEAEhACADQQRqEMkBIANBEGokAAwBCxCpAQALDAILQQAhASACuhADIQAMAQtBACEBIAIQBCEACyAIIAA2AgQgCCABNgIAIAVBMGokAAuSAQEEfyAALQC8AQRAIABBADoAvAEDQCAAIAFqIgJBiAFqIgMoAgAhBCADIAJB9ABqIgIoAgA2AgAgAiAENgIAIAFBBGoiAUEURw0AC0EAIQEDQCAAIAFqIgJBJGoiAygCACEEIAMgAigCADYCACACIAQ2AgAgAUEEaiIBQSRHDQALIABB3ABqQQAgACgCoAEQeAsLiwEBAX8CQCABIAJNBEAgACgCCCIEIAJJDQEgASACRwRAIAAoAgQiACACQQR0aiEEIAAgAUEEdGohAiADQQhqIQADQCACQSA2AgAgAiADKQAANwAEIAJBDGogAC8AADsAACAEIAJBEGoiAkcNAAsLDwsgASACQaCqwAAQ7AEACyACIARBoKrAABDqAQALkgQBCX8jAEEgayIEJAACQCABBEAgASgCACICQX9GDQEgASACQQFqNgIAIARBFGohAkGpjMEALQAAGiABQQRqIgMoAqABIQUgAygCnAEhBkEIQQQQ1wEiA0UEQEEEQQhB5IzBACgCACIAQeQAIAAbEQIAAAsgAyAFNgIEIAMgBjYCACACQQI2AgggAiADNgIEIAJBAjYCACABIAEoAgBBAWs2AgAjAEEQayIDJAACQAJAAkAgAigCCCIFIAIoAgBPDQAgA0EIaiEHIwBBIGsiASQAAkAgBSACKAIAIgZNBEACf0GBgICAeCAGRQ0AGiAGQQJ0IQggAigCBCEJAkAgBUUEQEEEIQogCSAIQQQQ5AEMAQtBBCAJIAhBBCAFQQJ0IgYQzQEiCkUNARoLIAIgBTYCACACIAo2AgRBgYCAgHgLIQIgByAGNgIEIAcgAjYCACABQSBqJAAMAQsgAUEBNgIMIAFBtIvAADYCCCABQgA3AhQgAUGQi8AANgIQIAFBCGpBiIzAABCkAQALIAMoAggiAUGBgICAeEYNACABRQ0BIAEgAygCDEHkjMEAKAIAIgBB5AAgABsRAgAACyADQRBqJAAMAQsQqQEACyAEKAIYIQEgBEEIaiICIAQoAhw2AgQgAiABNgIAIAQoAgwhASAAIAQoAgg2AgAgACABNgIEIARBIGokAA8LEPwBAAsQ/QEAC5EBAgR/AX4jAEEgayICJAAgASgCAEGAgICAeEYEQCABKAIMIQMgAkEUaiIEQQhqIgVBADYCACACQoCAgIAQNwIUIARB8OrAACADEBgaIAJBEGogBSgCACIDNgIAIAIgAikCFCIGNwMIIAFBCGogAzYCACABIAY3AgALIABBxO3AADYCBCAAIAE2AgAgAkEgaiQAC3gBA38gASAAKAIAIAAoAggiA2tLBEAgACADIAEQhwEgACgCCCEDCyAAKAIEIgUgA2ohBAJAAkAgAUECTwRAIAQgAiABQQFrIgEQhwIaIAUgASADaiIDaiEEDAELIAFFDQELIAQgAjoAACADQQFqIQMLIAAgAzYCCAu+AQEFfwJAIAAoAggiAgRAIAAoAgQhBiACIQQDQCAGIAJBAXYgA2oiAkECdGooAgAiBSABRg0CIAIgBCABIAVJGyIEIAJBAWogAyABIAVLGyIDayECIAMgBEkNAAsLIAAoAggiAiAAKAIARgRAIAAgAhCDAQsgACgCBCADQQJ0aiEEAkAgAiADTQRAIAIgA0YNASADIAIQZgALIARBBGogBCACIANrQQJ0EIYCCyAEIAE2AgAgACACQQFqNgIICwumAQEDfyMAQRBrIgYkACAGQQhqIAAgASACQbymwAAQYCAGKAIIIQcgAyACIAFrIgUgAyAFSRsiAyAGKAIMIgVLBEBBlKnAAEEhQbipwAAQnAEACyAFIANrIgUgByAFQQR0aiADEBIgACABIAEgA2ogBBBLIAEEQCAAIAFBAWtBzKbAABCIAUEAOgAMCyAAIAJBAWtB3KbAABCIAUEAOgAMIAZBEGokAAuOAgEFfwJAIAAoAggiAkUNACAAKAIEIQYgAiEDA0AgBiACQQF2IARqIgJBAnRqKAIAIgUgAUcEQCACIAMgASAFSRsiAyACQQFqIAQgASAFSxsiBGshAiADIARLDQEMAgsLAkAgACgCCCIBIAJLBEAgACgCBCACQQJ0aiIDKAIAGiADIANBBGogASACQX9zakECdBCGAiAAIAFBAWs2AggMAQsjAEEwayIAJAAgACABNgIEIAAgAjYCACAAQSxqQeMANgIAIABBAzYCDCAAQcDxwAA2AgggAEICNwIUIABB4wA2AiQgACAAQSBqNgIQIAAgAEEEajYCKCAAIAA2AiAgAEEIakGEoMAAEKQBAAsLC7NXAhp/AX4jAEEQayITJAACQCAABEAgACgCAA0BIABBfzYCACMAQSBrIgQkACAEIAI2AhwgBCABNgIYIAQgAjYCFCAEQQhqIARBFGoQ2gEgE0EIaiAEKQMINwMAIARBIGokACATKAIIIRcgEygCDCEUIwBBIGsiDiQAIA5BCGohFSAAQQRqIQMgFyEBIwBBMGsiECQAAkAgFEUNACADQcQBaiEGIAEgFGohGgNAAn8gASwAACICQQBOBEAgAkH/AXEhAiABQQFqDAELIAEtAAFBP3EhBSACQR9xIQQgAkFfTQRAIARBBnQgBXIhAiABQQJqDAELIAEtAAJBP3EgBUEGdHIhBSACQXBJBEAgBSAEQQx0ciECIAFBA2oMAQsgBEESdEGAgPAAcSABLQADQT9xIAVBBnRyciICQYCAxABGDQIgAUEEagshASAQQSBqIQVBwQAgAiACQZ8BSxshBAJAAkACQAJAAkACQAJAAkACQCAGLQCIBCIIDgUAAwMDAQMLIARBIGtB4ABJDQEMAgsgBEEwa0EMTw0BDAILIAUgAjYCBCAFQSE6AAAMBQsCQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIARB/wFxIgdBG0cEQCAHQdsARg0BIAgODQMEBQYHDAgMDAwCDAkMCyAGQQE6AIgEIAYQRgwkCwJAIAgODQIABAUGDAcMDAwBDAgMCyAGQQM6AIgEIAYQRgwjCyAEQSBrQd8ASQ0iDAkLIARBGEkNHyAEQRlGDR8gBEH8AXFBHEcNCAwfCyAEQfABcUEgRg0FIARBMGtBIEkNISAEQdEAa0EHSQ0hAkACQCAEQf8BcUHZAGsOBSMjACMBAAsgBEHgAGtBH08NCAwiCyAGQQw6AIgEDCALIARBMGtBzwBPDQYMIAsgBEEvSwRAIARBO0cgBEE6T3FFBEAgBkEEOgCIBAwfCyAEQUBqQT9JDSELIARB/AFxQTxHDQUgBiACNgIAIAZBBDoAiAQMHgsgBEFAakE/SQ0fIARB/AFxQTxHDQQgBkEGOgCIBAwdCyAEQUBqQT9PDQMgBkEAOgCIBAwcCyAEQSBrQeAASQ0bAkAgBEH/AXEiB0HPAE0EQCAHQRhrDgMGBQYBCyAHQZkBa0ECSQ0FIAdB0ABGDRwMBAsgB0EHRg0BDAMLIAYgAjYCACAGQQI6AIgEDBoLIAZBADoAiAQMGQsCQCAEQf8BcSIHQRhrDgMCAQIACyAHQZkBa0ECSQ0BIAdB0ABHDQAgCEEBaw4KAgQICQoTCwwNDhgLIARB8AFxIgdBgAFGDQAgBEGRAWtBBksNAgsgBkEAOgCIBAwUCyAGQQc6AIgEIAYQRgwVCwJAIAhBAWsOCgMCBQAHDwgJCgsPCyAHQSBHDQUgBiACNgIAIAZBBToAiAQMFAsgBEHwAXEhBwsgB0EgRw0BDA8LIARBGEkNDyAEQf8BcSIHQdgAayIJQQdLDQpBASAJdEHBAXFFDQogBkENOgCIBAwRCyAEQRhJDQ4gBEEZRg0OIARB/AFxQRxGDQ4MCgsgBEEYSQ0NIARBGUYNDSAEQfwBcUEcRg0NIARB8AFxQSBHDQkgBiACNgIAIAZBBToAiAQMDwsgBEEYSQ0MIARBGUYNDCAEQfwBcUEcRg0MDAgLIARBQGpBP08EQCAEQfABcSIHQSBGDQsgB0EwRw0IIAZBBjoAiAQMDgsMDwsgBEH8AXFBPEYNAyAEQfABcUEgRg0EIARBQGpBP08NBiAGQQo6AIgEDAwLIARBL00NBSAEQTpJDQogBEE7Rg0KIARBQGpBPksNBSAGQQo6AIgEDAsLIARBQGpBP08NBCAGQQo6AIgEDAoLIARBGEkNCSAEQRlGDQkgBEH8AXFBHEYNCQwDCyAGIAI2AgAgBkEIOgCIBAwICyAGIAI2AgAgBkEJOgCIBAwHCyAHQRlGDQQgBEH8AXFBHEYNBAsCQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAEQf8BcSIHQZABaw4QAwYGBgYGBgYABgYEAQIAAAULIAZBDToAiAQMFAsgBkEAOgCIBAwTCyAGQQw6AIgEDBILIAZBBzoAiAQgBhBGDBELIAZBAzoAiAQgBhBGDBALAkAgB0E6aw4CBAIACyAHQRlGDQILIAhBA2sOBwgOAwkECgYOCyAIQQNrDgcHDQ0IBAkGDQsgCEEDaw4HBgwKBwwIBQwLAkAgCEEDaw4HBgwMBwAIBQwLIAZBCzoAiAQMCwsgBEEYSQ0IIARB/AFxQRxHDQoMCAsgBEEwa0EKTw0JCyAGQQg6AIgEDAcLIARB8AFxQSBGDQQLIARB8AFxQTBHDQYgBkELOgCIBAwGCyAEQTpHDQUgBkEGOgCIBAwFCyAEQRhJDQIgBEEZRg0CIARB/AFxQRxHDQQMAgsgBEHwAXFBIEcEQCAEQTpHIARB/AFxQTxHcQ0EIAZBCzoAiAQMBAsgBiACNgIAIAZBCToAiAQMAwsgBiACNgIADAILIAUgAhBiDAQLIAYoAoQEIQQCQAJAAkACQAJAIAJBOmsOAgEAAgsgBkEfIARBAWoiAiACQSBGGzYChAQMAwsgBEEgSQ0BIARBIEH8mcAAEGcACyAEQSBPBEAgBEEgQYyawAAQZwALIAYgBEEEdGpBBGoiCCgCACIEQQZJBEAgCCAEQQF0akEEaiIEIAQvAQBBCmwgAkEwa0H/AXFqOwEADAILIARBBkGMn8AAEGcACyAGIARBBHRqQQRqIgQoAgBBAWohAiAEIAJBBSACQQVJGzYCAAsLIAVBMjoAAAwCCyAGQQA6AIgEAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAGKAIAIgRBgIDEAEYEQCACQeD//wBxQcAARg0BIAJBN2sOAgMEAgsgAkEwRg0GIAJBOEYNBSAEQShrDgIJCwwLIAUgAkFAa0GfAXEQYgwMCyACQeMARg0CDAoLIAVBEToAAAwKCyAFQQ86AAAMCQsgBUEkOgAAIAZBADoAiAQMCAsgBEEjaw4HAQYGBgYDBQYLIARBKGsOAgEDBQsgBUEOOgAADAULIAVBmgI7AQAMBAsgBUEaOwEADAMLIAVBmQI7AQAMAgsgBUEZOwEADAELIAVBMjoAAAsMAQsgBkEAOgCIBCMAQUBqIggkAAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgBigCACIEQYCAxABGBEAgAkFAag42AQIDBAUGBwgJCgsMDQ43Nw83NxARNzcSEzcUNzc3NzcVFhc3GBkaGxw3NzcdHjc3NzcfIDIhNwsCQCACQewAaw4FNTc3NzMACyACQegARg0zDDYLIAVBHToAACAFIAYvAQg7AQIMNgsgBUEMOgAAIAUgBi8BCDsBAgw1CyAFQQk6AAAgBSAGLwEIOwECDDQLIAVBCjoAACAFIAYvAQg7AQIMMwsgBUEIOgAAIAUgBi8BCDsBAgwyCyAFQQQ6AAAgBSAGLwEIOwECDDELIAVBBToAACAFIAYvAQg7AQIMMAsgBUECOgAAIAUgBi8BCDsBAgwvCyAFQQs6AAAgBSAGLwEYOwEEIAUgBi8BCDsBAgwuCyAFQQM6AAAgBSAGLwEIOwECDC0LIAYvAQgOBBcYGRoWCyAGLwEIDgMbHB0aCyAFQR46AAAgBSAGLwEIOwECDCoLIAVBFToAACAFIAYvAQg7AQIMKQsgBUENOgAAIAUgBi8BCDsBAgwoCyAFQS06AAAgBSAGLwEIOwECDCcLIAVBKDoAACAFIAYvAQg7AQIMJgsgBi8BCA4GGRgaGBgbGAsgBUEWOgAAIAUgBi8BCDsBAgwkCyAFQQE6AAAgBSAGLwEIOwECDCMLIAVBAjoAACAFIAYvAQg7AQIMIgsgBUEKOgAAIAUgBi8BCDsBAgwhCyAFQSI6AAAgBSAGLwEIOwECDCALIAVBLzoAACAFIAYvAQg7AQIMHwsgBUEwOgAAIAUgBi8BCDsBAgweCyAFQQs6AAAgBSAGLwEYOwEEIAUgBi8BCDsBAgwdCyAGLwEIDgQUExMVEwsgCEEIaiAGQQRqIAYoAoQEQZyawAAQnwEgCEE0aiICIAgoAggiBCAEIAgoAgxBBHRqEDsgCEEwaiACQQhqKAIANgAAIAggCCkCNDcAKCAFQSs6AAAgBSAIKQAlNwABIAVBCGogCEEsaikAADcAAAwbCyAIQRBqIAZBBGogBigChARBrJrAABCfASAIQTRqIgIgCCgCECIEIAQgCCgCFEEEdGoQOyAIQTBqIAJBCGooAgA2AAAgCCAIKQI0NwAoIAVBJToAACAFIAgpACU3AAEgBUEIaiAIQSxqKQAANwAADBoLIAhBGGogBkEEaiAGKAKEBEG8msAAEJ8BIAhBNGohCyAIKAIYIQIgCCgCHCEEIwBBIGsiByQAIAcgBDYCCCAHIAI2AgQgB0EbaiAHQQRqEBACQAJAAkAgBy0AG0ESRgRAIAtBADYCCCALQoCAgIAQNwIADAELQamMwQAtAAAaQRRBARDXASICRQ0BIAIgBygAGzYAACAHQQxqIgRBCGoiG0EBNgIAIAdBBDYCDCACQQRqIAdBH2otAAA6AAAgByACNgIQIAcoAgQhAiAHKAIIIQojAEEQayIJJAAgCSAKNgIEIAkgAjYCACAJQQtqIAkQECAJLQALQRJHBEAgBCgCCCINQQVsIREDQCAEKAIAIA1GBEACQCAEIQIjAEEQayIMJAAgDEEIaiEYIwBBIGsiCiQAAn9BACANQQFqIhIgDUkNABpBASEPIAIoAgAiGUEBdCIWIBIgEiAWSRsiEkEEIBJBBEsbIhZBBWwhHCASQZqz5swBSSESAkAgGUUEQEEAIQ8MAQsgCiAZQQVsNgIcIAogAigCBDYCFAsgCiAPNgIYIApBCGogEiAcIApBFGoQSCAKKAIIRQRAIAooAgwhDyACIBY2AgAgAiAPNgIEQYGAgIB4DAELIAooAhAhAiAKKAIMCyEPIBggAjYCBCAYIA82AgAgCkEgaiQAAkAgDCgCCCICQYGAgIB4RwRAIAJFDQEgAiAMKAIMQeSMwQAoAgAiAEHkACAAGxECAAALIAxBEGokAAwBCxCpAQALCyAEIA1BAWoiDTYCCCAEKAIEIBFqIgIgCSgACzYAACACQQRqIAlBC2oiAkEEai0AADoAACARQQVqIREgAiAJEBAgCS0AC0ESRw0ACwsgCUEQaiQAIAtBCGogGygCADYCACALIAcpAgw3AgALIAdBIGokAAwBC0EBQRRB5IzBACgCACIAQeQAIAAbEQIAAAsgCEEwaiALQQhqKAIANgAAIAggCCkCNDcAKCAFQSk6AAAgBSAIKQAlNwABIAVBCGogCEEsaikAADcAAAwZCyAFQRM6AAAgBSAGLwEYOwEEIAUgBi8BCDsBAgwYCyAFQSc6AAAMFwsgBUEmOgAADBYLIAVBMjoAAAwVCyAFQRc7AQAMFAsgBUGXAjsBAAwTCyAFQZcEOwEADBILIAVBlwY7AQAMEQsgBUEyOgAADBALIAVBGDsBAAwPCyAFQZgCOwEADA4LIAVBmAQ7AQAMDQsgBUEyOgAADAwLIAVBBzsBAAwLCyAFQYcCOwEADAoLIAVBhwQ7AQAMCQsgBUEyOgAADAgLIAVBLjsBAAwHCyAFQa4COwEADAYLIAYvAQhBCEYNAyAFQTI6AAAMBQsgBEEhRw0DIAVBFDoAAAwECyAEQT9HDQICQCAGKAKEBCICQX9HBEAgAkEBaiEEIAJBIEkNASAEQSBBzJrAABDqAQALQcyawAAQqgEACyAIQTRqIgIgBkEEaiIHIAcgBEEEdGoQNSAIQTBqIAJBCGooAgA2AAAgCCAIKQI0NwAoIAVBEjoAACAFIAgpACU3AAEgBUEIaiAIQSxqKQAANwAADAMLIARBP0cNAQJAIAYoAoQEIgJBf0cEQCACQQFqIQQgAkEgSQ0BIARBIEHcmsAAEOoBAAtB3JrAABCqAQALIAhBNGoiAiAGQQRqIgcgByAEQQR0ahA1IAhBMGogAkEIaigCADYAACAIIAgpAjQ3ACggBUEQOgAAIAUgCCkAJTcAASAFQQhqIAhBLGopAAA3AAAMAgsgBUExOgAAIAUgBi8BGDsBBCAFIAYvASg7AQIMAQsgBUEyOgAACyAIQUBrJAALIBAtACBBMkcEQAJAQQAhBEEAIQcjAEHgAGsiCCQAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAQQSBqIgItAABBAWsOMQECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEACyADLQDCASECIANBADoAwgEgA0EAIAMoAmhBfkF/IAIbaiICIAMoApwBIgRBAWsgAiAESRsgAkEASBs2AmgMMgsgAi8BAiEEIwBBEGsiCSQAIAlBCGohCyADKAJoIQ0gA0HQAGoiAigCBCEKIAogAigCCEECdGohAgJAAkAgBEEBIARBAUsbIgRBAWsiDARAQQEhBQNAIAJBBGshBCAHQQFqIQcDQCAEIgJBBGogCkYNAyAFBEAgAkEEayEEIAIoAgAgDU8NAQsLQQAhBSAHIAxHDQALCwNAIAIgCkYNASACQQRrIgIoAgAhBEEBIQUgDA0CIAQgDU8NAAsMAQtBACEFCyALIAQ2AgQgCyAFNgIAIAkoAgwhAiAJKAIIIQQgA0EAOgDCASADIAJBACAEGyICIAMoApwBIgRBAWsgAiAESRs2AmggCUEQaiQADDELIANBADoAwgEgAyACLwECIgJBASACQQFLG0EBayICIAMoApwBIgRBAWsgAiAESRs2AmgMMAsgAi8BAiEEIwBBEGsiCSQAIAlBCGohCiADKAJoIQsgA0HQAGoiBSgCBCECIAIgBSgCCEECdGohDQJ/AkAgBEEBIARBAUsbIgVBAWsiDARAQQEhBQNAIAdBAWohByAFQQFxIQUDQCANIAIiBEYNAyAFBEAgBEEEaiECIAQoAgAgC00NAQsLIARBBGohAkEAIQUgByAMRw0ACyAEQQRqIQILIAIhBANAIAQgDUYNAQJAIAwEQCACKAIAIQUMAQsgBCgCACEFIARBBGohBCAFIAtNDQELC0EBDAELQQALIQIgCiAFNgIEIAogAjYCACAJKAIMIQIgCSgCCCEEIANBADoAwgEgAyACIAMoApwBIgJBAWsiBSAEGyIEIAUgAiAESxs2AmggCUEQaiQADC8LIANBADoAwgEgA0EANgJoIAMgAygCoAFBAWsgAygCrAEiBCAEIAMoAmwiBEkbIgUgBCACLwECIgJBASACQQFLG2oiAiACIAVLGzYCbAwuCyADQQA6AMIBIANBADYCaCADQQAgAygCqAEiBCAEIAMoAmwiBEsbIgUgBCACLwECIgJBASACQQFLG2siAiACIAVIGzYCbAwtCyADQQA6AMIBIANBADYCaAwsCwJAAkACQAJAIAItAAFBAWsOAgECAAsgAygCaCICRQ0CIAIgAygCnAFPDQIgA0HQAGogAhBYDAILIANB0ABqIAMoAmgQWgwBCyADQQA2AlgLDCsLIAIvAQIhAiADLQDCASEEIANBADoAwgEgA0EAIAMoAmggAkEBIAJBAUsbIgJBf3NBACACayAEG2oiAiADKAKcASIEQQFrIAIgBEkbIAJBAEgbNgJoDCoLIAIvAQIhAiADQQA6AMIBIAMgAygCaCIEIAMoApwBQQFrIgUgBCAFSRs2AmggAyADKAKgAUEBayADKAKsASIEIAQgAygCbCIESRsiBSAEIAJBASACQQFLG2oiAiACIAVLGzYCbAwpCyADQQA6AMIBIANBACADKAJoIAIvAQIiAkEBIAJBAUsbaiICIAMoApwBIgRBAWsgAiAESRsgAkEASBs2AmgMKAsgAi8BAiEEIAIvAQQhAiADQQA6AMIBIAMgAkEBIAJBAUsbQQFrIgUgAygCnAEiB0EBayICIAUgB0kbIgUgAiACIAVLGzYCaCADIARBASAEQQFLGyADKAKoAUEAIAMtAL4BIgQbIgJqQQFrIgUgAiACIAVJGyICIAMoAqwBIAMoAqABQQFrIAQbIgQgAiAESRs2AmwMJwsgA0EAOgDCASADIAMoAmgiBCADKAKcAUEBayIFIAQgBUkbNgJoIANBACADKAKoASIEIAQgAygCbCIESxsiBSAEIAIvAQIiAkEBIAJBAUsbayICIAIgBUgbNgJsDCYLIAIvAQIhBCADKAJoIgIgAygCnAEiBU8EQCADQQA6AMIBIAMgBUEBayICNgJoCyAEQQEgBEEBSxsiBCADKAIYIAJrIgUgBCAFSRshByADQbIBaiEJAkACQCADIAMoAmwiBEGcpcAAEIgBIgooAggiBSACTwRAIAooAgQiCyACQQR0aiAFIAJrIAcQswEgBSAHayECIAUgB0kNASAHBEAgCyAFQQR0aiEFIAsgAkEEdGohAiAJQQhqIQcDQCACQSA2AgAgAiAJKQAANwAEIAJBDGogBy8AADsAACAFIAJBEGoiAkcNAAsLDAILIAIgBUHgqsAAEOkBAAsgAiAFQfCqwAAQ6QEACyAKQQA6AAwgBCADKAJkIgJPDSYgAygCYCAEakEBOgAADCULIwBBEGsiAiQAAkACQCADKAKgASIKBEAgAygCYCELIAMoAmQhBSADKAKcASEJA0AgCQRAQQAhBwNAIAJBADsBDCACQQI6AAggAkECOgAEIAJBxQA2AgAgAyAHIAQgAhCMASAJIAdBAWoiB0cNAAsLIAQgBUYNAiAEIAtqQQE6AAAgCiAEQQFqIgRHDQALCyACQRBqJAAMAQsgBSAFQfSswAAQZwALDCQLIANBADoAwgEgAyADKQJ0NwJoIAMgAykBfDcBsgEgAyADLwGGATsBvgEgA0G6AWogA0GEAWovAQA7AQAMIwsgAkEEaiICKAIEIQQgAigCACEKIAIoAggiAgRAIAJBAXQhByADQbIBaiEFIANB/ABqIQkgBCECA0ACQAJAAkACQAJAAkACQAJAAkACQAJAIAIvAQAiC0EBaw4HAgEBAQEDBAALIAtBlwhrDgMFBgcECwALIANBADoAwQEMBwsgA0EAOgDCASADQgA3AmggA0EAOgC+AQwGCyADQQA6AL8BDAULIANBADoAcAwECyADEFMMAgsgA0EAOgDCASADIAMpAnQ3AmggBSAJKQEANwEAIAMgAy8BhgE7Ab4BIAVBCGogCUEIai8BADsBAAwCCyADEFMgA0EAOgDCASADIAMpAnQ3AmggBSAJKQEANwEAIAVBCGogCUEIai8BADsBACADIAMvAYYBOwG+AQsgAxBCCyACQQJqIQIgB0ECayIHDQALCyAKBEAgBCAKQQF0QQIQ5AELDCILIAMgAygCbDYCeCADIAMpAbIBNwF8IAMgAy8BvgE7AYYBIANBhAFqIANBugFqLwEAOwEAIAMgAygCaCICIAMoApwBQQFrIgQgAiAESRs2AnQMIQsgAkEEaiICKAIEIQQgAigCACENIAIoAggiAgRAIAJBAXQhByADQfwAaiEJIANBsgFqIQogBCECA0ACQAJAAkACQAJAAkACQAJAAkACQCACLwEAIgVBAWsOBwIBAQEBAwQACyAFQZcIaw4DBwUGBAsACyADQQE6AMEBDAYLIANBAToAvgEgA0EAOgDCASADQQA2AmggAyADKAKoATYCbAwFCyADQQE6AL8BDAQLIANBAToAcAwDCyADIAMoAmw2AnggCSAKKQEANwEAIAMgAy8BvgE7AYYBIAlBCGogCkEIai8BADsBACADIAMoAmgiBSADKAKcAUEBayILIAUgC0kbNgJ0DAILIAMgAygCbDYCeCAJIAopAQA3AQAgAyADLwG+ATsBhgEgCUEIaiAKQQhqLwEAOwEAIAMgAygCaCIFIAMoApwBQQFrIgsgBSALSRs2AnQLQQAhBSMAQTBrIgskACADLQC8AUUEQCADQQE6ALwBA0AgAyAFaiIMQYgBaiIRKAIAIQ8gESAMQfQAaiIMKAIANgIAIAwgDzYCACAFQQRqIgVBFEcNAAtBACEFA0AgAyAFaiIMQSRqIhEoAgAhDyARIAwoAgA2AgAgDCAPNgIAIAVBBGoiBUEkRw0ACyALQQxqIAMoApwBIAMoAqABIgVBAUEAIANBsgFqECsgA0EMahCKASADKAIMIgwEQCADKAIQIAxBBHRBBBDkAQsgAyALQQxqQSQQiAJB3ABqQQAgBRB4CyALQTBqJAAgAxBCCyACQQJqIQIgB0ECayIHDQALCyANBEAgBCANQQF0QQIQ5AELDCALAkAgAi8BAiIEQQEgBEEBSxtBAWsiBCACLwEEIgIgAygCoAEiBSACG0EBayICSSACIAVJcUUEQCADKAKoASEEDAELIAMgAjYCrAEgAyAENgKoAQsgA0EAOgDCASADQQA2AmggAyAEQQAgAy0AvgEbNgJsDB8LIANBAToAcCADQQA7AL0BIANBADsBugEgA0ECOgC2ASADQQI6ALIBIANBADsBsAEgA0IANwKkASADQYCAgAg2AoQBIANBAjoAgAEgA0ECOgB8IANCADcCdCADIAMoAqABQQFrNgKsAQweCyADKAKgASADKAKsASIEQQFqIAQgAygCbCIESRshBSADIAQgBSACLwECIgJBASACQQFLGyADQbIBahAiIANB3ABqIAQgBRB4DB0LIAMgAygCaCADKAJsIgRBACACLwECIgJBASACQQFLGyADQbIBahAoIAQgAygCZCICTw0dIAMoAmAgBGpBAToAAAwcCwJAAkACQAJAIAItAAFBAWsOAwECAwALIAMgAygCaCADKAJsQQEgAyADQbIBahAoIANB3ABqIAMoAmwgAygCoAEQeAwCCyADIAMoAmggAygCbEECIAMgA0GyAWoQKCADQdwAakEAIAMoAmxBAWoQeAwBCyADQQAgAygCHCADQbIBahBLIANB3ABqQQAgAygCoAEQeAsMGwsgAyADKAJoIAMoAmwiBCACLQABQQRqIAMgA0GyAWoQKCAEIAMoAmQiAk8NGyADKAJgIARqQQE6AAAMGgsgAyACLQABOgCxAQwZCyADIAItAAE6ALABDBgLIAMoAlhBAnQhAiADKAJUIQUgAygCaCEHAkACQANAIAJFDQEgAkEEayECIAUoAgAhBCAFQQRqIQUgBCAHTQ0ACyADKAKcASICQQFrIQUMAQsgAygCnAEiAkEBayIFIQQLIANBADoAwgEgAyAEIAUgAiAESxs2AmgMFwsg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+gA2AiggACAAQSRqNgIUIAAgAEEvajYCJCAAQQxqQeCXwAAQpAEACyATQRBqJAAgAAvGAQECfyMAQRBrIgAkACABKAIUQbDswABBCyABKAIYKAIMEQEAIQMgAEEIaiICQQA6AAUgAiADOgAEIAIgATYCACACIgEtAAQhAwJAIAItAAVFBEAgA0EARyEBDAELQQEhAiADRQRAIAEoAgAiAi0AHEEEcUUEQCABIAIoAhRBh/XAAEECIAIoAhgoAgwRAQAiAToABAwCCyACKAIUQYb1wABBASACKAIYKAIMEQEAIQILIAEgAjoABCACIQELIABBEGokACABCzIBAX8gAEEQahAwAkAgACgCACIBQYCAgIB4Rg0AIAFFDQAgACgCBCABQQR0QQQQ5AELCy8BAn8gACAAKAKoASICIAAoAqwBQQFqIgMgASAAQbIBahBZIABB3ABqIAIgAxB4Cy8BAn8gACAAKAKoASICIAAoAqwBQQFqIgMgASAAQbIBahAiIABB3ABqIAIgAxB4CysAIAEgAkkEQEHcosAAQSNBzKPAABCcAQALIAIgACACQQR0aiABIAJrEBILJQAgAEEBNgIEIAAgASgCBCABKAIAa0EEdiIBNgIIIAAgATYCAAslACAARQRAQfCXwABBMhD7AQALIAAgAiADIAQgBSABKAIQEQgACzAAIAEoAhQgAC0AAEECdCIAQYyFwABqKAIAIABB1ITAAGooAgAgASgCGCgCDBEBAAswACABKAIUIAAtAABBAnQiAEGEi8AAaigCACAAQfiKwABqKAIAIAEoAhgoAgwRAQALMAAgASgCFCAALQAAQQJ0IgBB2JTAAGooAgAgAEHMlMAAaigCACABKAIYKAIMEQEACyMAIABFBEBB8JfAAEEyEPsBAAsgACACIAMgBCABKAIQEQUACyMAIABFBEBB8JfAAEEyEPsBAAsgACACIAMgBCABKAIQERgACyMAIABFBEBB8JfAAEEyEPsBAAsgACACIAMgBCABKAIQERoACyMAIABFBEBB8JfAAEEyEPsBAAsgACACIAMgBCABKAIQERwACyMAIABFBEBB8JfAAEEyEPsBAAsgACACIAMgBCABKAIQEQwACygBAX8gACgCACIBQYCAgIB4ckGAgICAeEcEQCAAKAIEIAFBARDkAQsLLgAgASgCFEH8icAAQfeJ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iPjAADYCCCADQgI3AhQgA0HjADYCJCADIANBIGo2AhAgAyADQQRqNgIoIAMgAzYCICADQQhqIAIQpAEACwsAIAA1AgAgARAkC2wBAX8jAEEwayIDJAAgAyABNgIEIAMgADYCACADQSxqQeMANgIAIANBAjYCDCADQbz4wAA2AgggA0ICNwIUIANB4wA2AiQgAyADQSBqNgIQIAMgA0EEajYCKCADIAM2AiAgA0EIaiACEKQBAAsLACAAMQAAIAEQJAsPAEGt8sAAQSsgABCcAQALCwAgACkDACABECQLCwAgACMAaiQAIwALDAAgACgCACABEMMBCwsAIAAoAgAgARAnCwcAIAAQyQELBwAgABDBAQsZACABKAIUQcyHwABBBSABKAIYKAIMEQEAC5cBAQF/IAAoAgAhAiMAQUBqIgAkACAAQgA3AzggAEE4aiACKAIAEA0gACAAKAI8IgI2AjQgACAAKAI4NgIwIAAgAjYCLCAAQd8ANgIoIABBAjYCECAAQcznwAA2AgwgAEIBNwIYIAAgAEEsaiICNgIkIAAgAEEkajYCFCABKAIUIAEoAhggAEEMahAYIAIQyQEgAEFAayQAC6IBAQR/QQIhAyMAQRBrIgIkACABKAIUQazywABBASABKAIYKAIMEQEAIQUgAkEEaiIEQQA6AAUgBCAFOgAEIAQgATYCAANAIAIgADYCDCACQQRqIAJBDGpByIzAABAsIABBAWohACADQQFrIgMNAAsgAkEEaiIALQAEBH9BAQUgACgCACIAKAIUQY71wABBASAAKAIYKAIMEQEACyACQRBqJAALowEBA38jAEEQayICJAAgASgCFEGs8sAAQQEgASgCGCgCDBEBACEEIAJBBGoiA0EAOgAFIAMgBDoABCADIAE2AgBBgAQhAQNAIAIgADYCDCACQQRqIAJBDGpBuIzAABAsIABBEGohACABQRBrIgENAAsgAkEEaiIALQAEBH9BAQUgACgCACIAKAIUQY71wABBASAAKAIYKAIMEQEACyACQRBqJAALBwAgABDCAQsMACAAEIoBIAAQwQELCQAgACABEA4ACw0AQeTowABBGxD7AQALDgBB/+jAAEHPABD7AQALDQAgAEHY6sAAIAEQGAsNACAAQfDqwAAgARAYCw0AIABBhO/AACABEBgLGQAgASgCFEH87sAAQQUgASgCGCgCDBEBAAuGBAEFfyMAQRBrIgMkAAJAAn8CQCABQYABTwRAIANBADYCDCABQYAQSQ0BIAFBgIAESQRAIAMgAUE/cUGAAXI6AA4gAyABQQx2QeABcjoADCADIAFBBnZBP3FBgAFyOgANQQMMAwsgAyABQT9xQYABcjoADyADIAFBBnZBP3FBgAFyOgAOIAMgAUEMdkE/cUGAAXI6AA0gAyABQRJ2QQdxQfABcjoADEEEDAILIAAoAggiAiAAKAIARgRAIwBBIGsiBCQAAkACQCACQQFqIgJFDQAgACgCACIFQQF0IgYgAiACIAZJGyICQQggAkEISxsiAkF/c0EfdiEGIAQgBQR/IAQgBTYCHCAEIAAoAgQ2AhRBAQVBAAs2AhggBEEIaiAGIAIgBEEUahBEIAQoAggEQCAEKAIMIgBFDQEgACAEKAIQQeSMwQAoAgAiAEHkACAAGxECAAALIAQoAgwhBSAAIAI2AgAgACAFNgIEIARBIGokAAwBCxCpAQALIAAoAgghAgsgACACQQFqNgIIIAAoAgQgAmogAToAAAwCCyADIAFBP3FBgAFyOgANIAMgAUEGdkHAAXI6AAxBAgshASABIAAoAgAgACgCCCICa0sEQCAAIAIgARA+IAAoAgghAgsgACgCBCACaiADQQxqIAEQiAIaIAAgASACajYCCAsgA0EQaiQAQQALDQAgAEHg9MAAIAEQGAsKACACIAAgARATC8ECAQN/IAAoAgAhACMAQYABayIEJAACfwJAAkAgASgCHCICQRBxRQRAIAJBIHENASAANQIAIAEQJAwDCyAAKAIAIQJBACEAA0AgACAEakH/AGogAkEPcSIDQTByIANB1wBqIANBCkkbOgAAIABBAWshACACQRBJIAJBBHYhAkUNAAsMAQsgACgCACECQQAhAANAIAAgBGpB/wBqIAJBD3EiA0EwciADQTdqIANBCkkbOgAAIABBAWshACACQRBJIAJBBHYhAkUNAAsgAEGAAWoiAkGBAU8EQCACQYABQaz1wAAQ6QEACyABQbz1wABBAiAAIARqQYABakEAIABrEBUMAQsgAEGAAWoiAkGBAU8EQCACQYABQaz1wAAQ6QEACyABQbz1wABBAiAAIARqQYABakEAIABrEBULIARBgAFqJAALkQUBB38CQAJ/AkAgAiIEIAAgAWtL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AIYIEAAIAAAAjggQAA4AAACcCBAABAAAAKAIEAALAAAAmAcQAAsAAAC0BxAADgAAAKsIEAANAAAAuAgQABAAAADICBAAEAAAANgIEAAKAAAA4ggQAA0AAADvCBAACQAAAPgIEAATAAAACwkQAAsAAAAWCRAACAAAAFByaW1hcnlBbHRlcm5hdGVBcHBsaWNhdGlvbkN1cnNvcmNvbHJvd3Zpc2libGVOb25lU29tZQAAJwAAAAQAAAAEAAAAJgAAACcAAAAEAAAABAAAAEMAAABEaXJ0eUxpbmVzAAAnAAAABAAAAAQAAABEAAAABgAAAAQAAAAFAAAAVwcQAF0HEABhBxAAY2Fubm90IGFjY2VzcyBhIFRocmVhZCBMb2NhbCBTdG9yYWdlIHZhbHVlIGR1cmluZyBvciBhZnRlciBkZXN0cnVjdGlvbgAARgAAAAAAAAABAAAARwAAAC9ydXN0Yy85YjAwOTU2ZTU2MDA5YmFiMmFhMTVkN2JmZjEwOTE2NTk5ZTNkNmQ2L2xpYnJhcnkvc3RkL3NyYy90aHJlYWQvbG9jYWwucnMAvAoQAE8AAAAEAQAAGgAAAAAAAAD//////////yALEABBuJbAAAvZFiBjYW4ndCBiZSByZXByZXNlbnRlZCBhcyBhIEphdmFTY3JpcHQgbnVtYmVyHAsQAAAAAAA4CxAALAAAAEgAAAAvaG9tZS9ydW5uZXIvLmNhcmdvL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tNmYxN2QyMmJiYTE1MDAxZi9zZXJkZS13YXNtLWJpbmRnZW4tMC42LjUvc3JjL2xpYi5ycwAAAHgLEABlAAAANQAAAA4AAABjbG9zdXJlIGludm9rZWQgcmVjdXJzaXZlbHkgb3IgYWZ0ZXIgYmVpbmcgZHJvcHBlZC9ydXN0Yy85YjAwOTU2ZTU2MDA5YmFiMmFhMTVkN2JmZjEwOTE2NTk5ZTNkNmQ2L2xpYnJhcnkvYWxsb2Mvc3JjL3ZlYy9tb2QucnMAACIMEABMAAAAYAgAACQAAAAiDBAATAAAABoGAAAVAAAAL2hvbWUvcnVubmVyLy5jYXJnby9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTZmMTdkMjJiYmExNTAwMWYvYXZ0LTAuMTUuMC9zcmMvcGFyc2Vy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Ai8wMTIzAgICAgICNAICNTY3Ajg5Ojs8PT4/OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5QDk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTlBAgJCQwICREVGR0hJAko5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTlLAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICOTk5OUwCAgICAk1OT1ACAgJRAlJTAgICAgICAgICAgICAlRVAgJWAlcCAlhZWltcXV5fYGECYmMCZGVmZwJoAmlqa2wCAm1ub3ACcXICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnMCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0dQICAgICAgJ2dzk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5eDk5OTk5OTk5OXl6AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ7OTl8OTl9AgICAgICAgICAgICAgICAgICAn4CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ/AgICgIGCAgICAgICAgICAgICAgICg4QCAgICAgICAgIChYZ1AgKHAgICiAICAgICAgKJigICAgICAgICAgICAgKLjAKNjgKPkJGSk5SVlgKXAgKYmZqbAgICAgICAgICAjk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OZwdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHQICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAJ0CAgICnp8CBAIFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdAgIeAgICAgICAh8gISIjAiQlJicoKQIqAgICAqChoqOkpaYup6ipqqusrTMCAgICAgKuAgI1NjcCODk6Ozw9Pq85OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTlMAgICAgKwTk+xhYZ1AgKHAgICiAICAgICAgKJigICAgICAgICAgICAgKLjLKzjgKPkJGSk5SVlgKXAgKYmZqbAgICAgICAgICAlVVdVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQBBvLvAAAspVVVVVRUAUFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQEAQe+7wAALxAEQQRBVVVVVVVdVVVVVVVVVVVVRVVUAAEBU9d1VVVVVVVVVVRUAAAAAAFVVVVX8XVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVBQAUABQEUFVVVVVVVVUVUVVVVVVVVVUAAAAAAABAVVVVVVVVVVVV1VdVVVVVVVVVVVVVVQUAAFRVVVVVVVVVVVVVVVVVFQAAVVVRVVVVVVUFEAAAAQFQVVVVVVVVVVVVVQFVVVVVVf////9/VVVVUFUAAFVVVVVVVVVVVVUFAEHAvcAAC5gEQFVVVVVVVVVVVVVVVVVFVAEAVFEBAFVVBVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVEAVRVUVUVVVUFVVVVVVVVRUFVVVVVVVVVVVVVVVVVVVRBFRRQUVVVVVVVVVVQUVVVQVVVVVVVVVVVVVVVVVVVVAEQVFFVVVVVBVVVVVVVBQBRVVVVVVVVVVVVVVVVVVUEAVRVUVUBVVUFVVVVVVVVVUVVVVVVVVVVVVVVVVVVVUVUVVVRVRVVVVVVVVVVVVVVVFRVVVVVVVVVVVVVVVVVBFQFBFBVQVVVBVVVVVVVVVVRVVVVVVVVVVVVVVVVVVUURAUEUFVBVVUFVVVVVVVVVVBVVVVVVVVVVVVVVVVVFUQBVFVBVRVVVQVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVVVRRUFRFUVVVVVVVVVVVVVVVVVVVVVVVVVVVVRAEBVVRUAQFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVEAAFRVVQBAVVVVVVVVVVVVVVVVVVVVVVVVUFVVVVVVVRFRVVVVVVVVVVVVVVVVVQEAAEAABFUBAAABAAAAAAAAAABUVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAQQAQUFVVVVVVVVQBVRVVVUBVFVVRUFVUVVVVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqoAQYDCwAALkANVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQFVVVVVVVVVVVVVVVUFVFVVVVVVVQVVVVVVVVVVBVVVVVVVVVUFVVVVf//99//911931tXXVRAAUFVFAQAAVVdRVVVVVVVVVVVVVRUAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVBVVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAFVRVRVUBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVxUUVVVVVVVVVVVVVVVVVVVFAEBEAQBUFQAAFFVVVVVVVVVVVVVVVQAAAAAAAABAVVVVVVVVVVVVVVVVAFVVVVVVVVVVVVVVVQAAUAVVVVVVVVVVVVUVAABVVVVQVVVVVVVVVQVQEFBVVVVVVVVVVVVVVVVVRVARUFVVVVVVVVVVVVVVVVVVAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAAAAABABUUVVUUFVVVVVVVVVVVVVVVVVVVVVVAEGgxcAAC5MIVVUVAFVVVVVVVQVAVVVVVVVVVVVVVVVVAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQAAAAAAAAAAVFVVVVVVVVVVVfVVVVVpVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX9V9dVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVfVVVVVVVX1VVVVVVVVVVVVVVVf///1VVVVVVVVVVVVXVVVVVVdVVVVVdVfVVVVVVfVVfVXVVV1VVVVV1VfVddV1VXfVVVVVVVVVVV1VVVVVVVVVVd9XfVVVVVVVVVVVVVVVVVVVV/VVVVVVVVVdVVdVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV1VdVVVVVVVVVVVVVVVVXXVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVUFVVVVVVVVVVVVVVVVVVVf3///////////////9fVdVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAAAAAAAAAACqqqqqqqqaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlVVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqWlVVVVVVVaqqqqqqqqqqqqqqqqqqCgCqqqpqqaqqqqqqqqqqqqqqqqqqqqqqqqqqaoGqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVamqqqqqqqqqqqqqqaqqqqqqqqqqqqqqqqiqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVVWVqqqqqqqqqqqqqqpqqqqqqqqqqqqqqlVVqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlVVVVVVVVVVVVVVVVVVVVWqqqpWqqqqqqqqqqqqqqqqqmpVVVVVVVVVVVVVVVVVX1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVAAABQVVVVVVVVVQVVVVVVVVVVVVVVVVVVVVVVVVVVVVBVVVVFRRVVVVVVVVVBVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUFVVVVVVVQAAAABQVUUVVVVVVVVVVVVVBQBQVVVVVVUVAABQVVVVqqqqqqqqqlZAVVVVVVVVVVVVVVUVBVBQVVVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVUBQEFBVVUVVVVUVVVVVVVVVVVVVVVUVVVVVVVVVVVVVVVVBBRUBVFVVVVVVVVVVVVVUFVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVRRVVVVVaqqqqqqqqqqqlVVVQAAAAAAQBUAQb/NwAAL4QxVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAAADwqqpaVQAAAACqqqqqqqqqqmqqqqqqaqpVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVqaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVlVVVVVVVVVVVVVVVVVVBVRVVVVVVVVVVVVVVVVVVVWqalVVAABUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQVAVQFBVQBVVVVVVVVVVVVVQBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUFVVVVVVVXVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVUVVVVVVVVVVVVVVVVVVVVVVVVVQFVVVVVVVVVVVVVVVVVVVVVVQUAAFRVVVVVVVVVVVVVVQVQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVVVVVVVVVVVVVVVVUAAABAVVVVVVVVVVVVVRRUVRVQVVVVVVVVVVVVVVUVQEFVRVVVVVVVVVVVVVVVVVVVVUBVVVVVVVVVVRUAAQBUVVVVVVVVVVVVVVVVVVUVVVVVUFVVVVVVVVVVVVVVVQUAQAVVARRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVQBFVFUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFRUAQFVVVVVVUFVVVVVVVVVVVVVVVVUVRFRVVVVVFVVVVQUAVABUVVVVVVVVVVVVVVVVVVVVVQAABURVVVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVRQARBEEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVBVBVEFRVVVVVVVVQVVVVVVVVVVVVVVVVVVVVVVVVVVUVAEARVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVUQAQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQEFEABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRUAAEFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVFQQRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAAVVVFVVVVVVVVUBAEBVVVVVVVVVVVUVAARAVRVVVQFAAVVVVVVVVVVVVVUAAAAAQFBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAEAAEFVVVVVVVVVVVVVVVVVVVVVVVVVVBQAAAAAABQAEQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQFARRAAAFVVVVVVVVVVVVVVVVVVVVVVVVARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVRVVUBVVVVVVVVVVVVVVVUFQFVEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQVAAAAUFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAFRVVVVVVVVVVVVVVVVVVQBAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVUVQFVVVVVVVVVVVVVVVVVVVVVVVVWqVFVVWlVVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlVVqqqqqqqqqqqqqqqqqqqqqqqqqqqqWlVVVVVVVVVVVVWqqlZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqappqqqqqqqqqqpqVVVVZVVVVVVVVVVqWVVVVapVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVVVVVVVVVVVBAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAEGr2sAAC3VQAAAAAABAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVEVAFAAAAAEABAFVVVVVVVVUFUFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQVUVVVVVVVVVVVVVVVVVVUAQa3bwAALAkAVAEG728AAC8UGVFVRVVVVVFVVVVUVAAEAAABVVVVVVVVVVVVVVVVVVVVVVVVVVQBAAAAAABQAEARAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVUAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAQFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQBAVVVVVVVVVVVVVVVVVVVXVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVdVVVVVVVVVVVVVVVVVVVVV1/f9/VVVVVVVVVVVVVVVVVVVVVVVV9f///////25VVVWqqrqqqqqq6vq/v1WqqlZVX1VVVapaVVVVVVVV//////////9XVVX9/9////////////////////////f//////1VVVf////////////9/1f9VVVX/////V1f//////////////////////3/3/////////////////////////////////////////////////////////////9f///////////////////9fVVXVf////////1VVVVV1VVVVVVVVfVVVVVdVVVVVVVVVVVVVVVVVVVVVVVVVVdX///////////////////////////9VVVVVVVVVVVVVVVX//////////////////////19VV3/9Vf9VVdVXVf//V1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf///1VXVVVVVVVV//////////////9////f/////////////////////////////////////////////////////////////1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX///9X//9XVf//////////////3/9fVfX///9V//9XVf//V1WqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqWlVVVVVVVVVVWZZVYaqlWapVVVVVVZVVVVVVVVVVlVVVAEGO4sAACwEDAEGc4sAAC4oqVVVVVVWVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVAJZqWlpqqgVAplmVZVVVVVVVVVVVAAAAAFVWVVWpVlVVVVVVVVVVVVZVVVVVVVVVVQAAAAAAAAAAVFVVVZVZWVVVZVVVaVVVVVVVVVVVVVVVlVaVaqqqqlWqqlpVVVVZVaqqqlVVVVVlVVVaVVVVVaVlVlVVVZVVVVVVVVWmlpqWWVllqZaqqmZVqlVaWVVaVmVVVVVqqqWlWlVVVaWqWlVVWVlVVVlVVVVVVZVVVVVVVVVVVVVVVVVVVVVVVVVVVWVV9VVVVWlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlWqqqqqqqqqqqpVVVWqqqqqpVpVVZqqWlWlpVVaWqWWpVpVVVWlWlWVVVVVfVVpWaVVX1VmVVVVVVVVVVVmVf///1VVVZqaappVVVXVVVVVVdVVVaVdVfVVVVVVvVWvqrqqq6qqmlW6qvquuq5VXfVVVVVVVVVVV1VVVVVZVVVVd9XfVVVVVVVVVaWqqlVVVVVVVdVXVVVVVVVVVVVVVVVVV61aVVVVVVVVVVVVqqqqqqqqqmqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqoAAADAqqpaVQAAAACqqqqqqqqqqmqqqqqqaqpVVVVVVVVVVVVVVVUFVFVVVVVVVVVVVVVVVVVVVapqVVUAAFRZqqpqVaqqqqqqqqpaqqqqqqqqqqqqqqqqqqpaVaqqqqqqqqq6/v+/qqqqqlZVVVVVVVVVVVVVVVVV9f///////0pzVmFsdWUoKQAAAMAzEAAIAAAAyDMQAAEAAABUcmllZCB0byBzaHJpbmsgdG8gYSBsYXJnZXIgY2FwYWNpdHncMxAAJAAAAC9ydXN0Yy85YjAwOTU2ZTU2MDA5YmFiMmFhMTVkN2JmZjEwOTE2NTk5ZTNkNmQ2L2xpYnJhcnkvYWxsb2Mvc3JjL3Jhd192ZWMucnMINBAATAAAAOcBAAAJAAAAbnVsbCBwb2ludGVyIHBhc3NlZCB0byBydXN0cmVjdXJzaXZlIHVzZSBvZiBhbiBvYmplY3QgZGV0ZWN0ZWQgd2hpY2ggd291bGQgbGVhZCB0byB1bnNhZmUgYWxpYXNpbmcgaW4gcnVzdAAAVHJpZWQgdG8gc2hyaW5rIHRvIGEgbGFyZ2VyIGNhcGFjaXR50DQQACQAAAAvcnVzdGMvOWIwMDk1NmU1NjAwOWJhYjJhYTE1ZDdiZmYxMDkxNjU5OWUzZDZkNi9saWJyYXJ5L2FsbG9jL3NyYy9yYXdfdmVjLnJz/DQQAEwAAADnAQAACQAAAGAAAAAMAAAABAAAAGEAAABiAAAAEQAAAGUAAAAMAAAABAAAAGYAAABnAAAAaAAAAC9ydXN0L2RlcHMvZGxtYWxsb2MtMC4yLjYvc3JjL2RsbWFsbG9jLnJzYXNzZXJ0aW9uIGZhaWxlZDogcHNpemUgPj0gc2l6ZSArIG1pbl9vdmVyaGVhZACINRAAKQAAAKgEAAAJAAAAYXNzZXJ0aW9uIGZhaWxlZDogcHNpemUgPD0gc2l6ZSArIG1heF9vdmVyaGVhZAAAiDUQACkAAACuBAAADQAAAEFjY2Vzc0Vycm9ybWVtb3J5IGFsbG9jYXRpb24gb2YgIGJ5dGVzIGZhaWxlZAAAADs2EAAVAAAAUDYQAA0AAABsaWJyYXJ5L3N0ZC9zcmMvYWxsb2MucnNwNhAAGAAAAGIBAAAJAAAAbGlicmFyeS9zdGQvc3JjL3Bhbmlja2luZy5yc5g2EAAcAAAAhAIAAB4AAABlAAAADAAAAAQAAABpAAAAagAAAAgAAAAEAAAAawAAAGoAAAAIAAAABAAAAGwAAABtAAAAbgAAABAAAAAEAAAAbwAAAHAAAABxAAAAAAAAAAEAAAByAAAASGFzaCB0YWJsZSBjYXBhY2l0eSBvdmVyZmxvdxw3EAAcAAAAL3J1c3QvZGVwcy9oYXNoYnJvd24tMC4xNC4zL3NyYy9yYXcvbW9kLnJzAABANxAAKgAAAFYAAAAoAAAARXJyb3IAAABzAAAADAAAAAQAAAB0AAAAdQAAAHYAAABjYXBhY2l0eSBvdmVyZmxvdwAAAJw3EAARAAAAbGlicmFyeS9hbGxvYy9zcmMvcmF3X3ZlYy5yc7g3EAAcAAAAGQAAAAUAAABhIGZvcm1hdHRpbmcgdHJhaXQgaW1wbGVtZW50YXRpb24gcmV0dXJuZWQgYW4gZXJyb3IAdwAAAAAAAAABAAAAeAAAAGxpYnJhcnkvYWxsb2Mvc3JjL2ZtdC5ycyg4EAAY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");

          var loadVt = async () => {
                  await __wbg_init(wasm_code);
                  return exports$1;
              };

  class Clock {
    constructor() {
      let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1.0;
      this.speed = speed;
      this.startTime = performance.now();
    }
    getTime() {
      return this.speed * (performance.now() - this.startTime) / 1000.0;
    }
    setTime(time) {
      this.startTime = performance.now() - time / this.speed * 1000.0;
    }
  }
  class NullClock {
    constructor() {}
    getTime(_speed) {}
    setTime(_time) {}
  }

  // Efficient array transformations without intermediate array objects.
  // Inspired by Elixir's streams and Rust's iterator adapters.

  class Stream {
    constructor(input, xfs) {
      this.input = typeof input.next === "function" ? input : input[Symbol.iterator]();
      this.xfs = xfs ?? [];
    }
    map(f) {
      return this.transform(Map$1(f));
    }
    flatMap(f) {
      return this.transform(FlatMap(f));
    }
    filter(f) {
      return this.transform(Filter(f));
    }
    take(n) {
      return this.transform(Take(n));
    }
    drop(n) {
      return this.transform(Drop(n));
    }
    transform(f) {
      return new Stream(this.input, this.xfs.concat([f]));
    }
    multiplex(other, comparator) {
      return new Stream(new Multiplexer(this[Symbol.iterator](), other[Symbol.iterator](), comparator));
    }
    toArray() {
      return Array.from(this);
    }
    [Symbol.iterator]() {
      let v = 0;
      let values = [];
      let flushed = false;
      const xf = compose(this.xfs, val => values.push(val));
      return {
        next: () => {
          if (v === values.length) {
            values = [];
            v = 0;
          }
          while (values.length === 0) {
            const next = this.input.next();
            if (next.done) {
              break;
            } else {
              xf.step(next.value);
            }
          }
          if (values.length === 0 && !flushed) {
            xf.flush();
            flushed = true;
          }
          if (values.length > 0) {
            return {
              done: false,
              value: values[v++]
            };
          } else {
            return {
              done: true
            };
          }
        }
      };
    }
  }
  function Map$1(f) {
    return emit => {
      return input => {
        emit(f(input));
      };
    };
  }
  function FlatMap(f) {
    return emit => {
      return input => {
        f(input).forEach(emit);
      };
    };
  }
  function Filter(f) {
    return emit => {
      return input => {
        if (f(input)) {
          emit(input);
        }
      };
    };
  }
  function Take(n) {
    let c = 0;
    return emit => {
      return input => {
        if (c < n) {
          emit(input);
        }
        c += 1;
      };
    };
  }
  function Drop(n) {
    let c = 0;
    return emit => {
      return input => {
        c += 1;
        if (c > n) {
          emit(input);
        }
      };
    };
  }
  function compose(xfs, push) {
    return xfs.reverse().reduce((next, curr) => {
      const xf = toXf(curr(next.step));
      return {
        step: xf.step,
        flush: () => {
          xf.flush();
          next.flush();
        }
      };
    }, toXf(push));
  }
  function toXf(xf) {
    if (typeof xf === "function") {
      return {
        step: xf,
        flush: () => {}
      };
    } else {
      return xf;
    }
  }
  class Multiplexer {
    constructor(left, right, comparator) {
      this.left = left;
      this.right = right;
      this.comparator = comparator;
    }
    [Symbol.iterator]() {
      let leftItem;
      let rightItem;
      return {
        next: () => {
          if (leftItem === undefined && this.left !== undefined) {
            const result = this.left.next();
            if (result.done) {
              this.left = undefined;
            } else {
              leftItem = result.value;
            }
          }
          if (rightItem === undefined && this.right !== undefined) {
            const result = this.right.next();
            if (result.done) {
              this.right = undefined;
            } else {
              rightItem = result.value;
            }
          }
          if (leftItem === undefined && rightItem === undefined) {
            return {
              done: true
            };
          } else if (leftItem === undefined) {
            const value = rightItem;
            rightItem = undefined;
            return {
              done: false,
              value: value
            };
          } else if (rightItem === undefined) {
            const value = leftItem;
            leftItem = undefined;
            return {
              done: false,
              value: value
            };
          } else if (this.comparator(leftItem, rightItem)) {
            const value = leftItem;
            leftItem = undefined;
            return {
              done: false,
              value: value
            };
          } else {
            const value = rightItem;
            rightItem = undefined;
            return {
              done: false,
              value: value
            };
          }
        }
      };
    }
  }

  async function parse$2(data) {
    let header;
    let events;
    if (data instanceof Response) {
      const text = await data.text();
      const result = parseJsonl(text);
      if (result !== undefined) {
        header = result.header;
        events = result.events;
      } else {
        header = JSON.parse(text);
      }
    } else if (typeof data === "object" && typeof data.version === "number") {
      header = data;
    } else if (Array.isArray(data)) {
      header = data[0];
      events = data.slice(1, data.length);
    } else {
      throw "invalid data";
    }
    if (header.version === 1) {
      return parseAsciicastV1(header);
    } else if (header.version === 2) {
      return parseAsciicastV2(header, events);
    } else {
      throw `asciicast v${header.version} format not supported`;
    }
  }
  function parseJsonl(jsonl) {
    const lines = jsonl.split("\n");
    let header;
    try {
      header = JSON.parse(lines[0]);
    } catch (_error) {
      return;
    }
    const events = new Stream(lines).drop(1).filter(l => l[0] === "[").map(JSON.parse).toArray();
    return {
      header,
      events
    };
  }
  function parseAsciicastV1(data) {
    let time = 0;
    const events = new Stream(data.stdout).map(e => {
      time += e[0];
      return [time, "o", e[1]];
    });
    return {
      cols: data.width,
      rows: data.height,
      events
    };
  }
  function parseAsciicastV2(header, events) {
    return {
      cols: header.width,
      rows: header.height,
      theme: parseTheme$1(header.theme),
      events,
      idleTimeLimit: header.idle_time_limit
    };
  }
  function parseTheme$1(theme) {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    const paletteRegex = /^(#[0-9A-Fa-f]{6}:){7,}#[0-9A-Fa-f]{6}$/;
    const fg = theme?.fg;
    const bg = theme?.bg;
    const palette = theme?.palette;
    if (colorRegex.test(fg) && colorRegex.test(bg) && paletteRegex.test(palette)) {
      return {
        foreground: fg,
        background: bg,
        palette: palette.split(":")
      };
    }
  }
  function unparseAsciicastV2(recording) {
    const header = JSON.stringify({
      version: 2,
      width: recording.cols,
      height: recording.rows
    });
    const events = recording.events.map(JSON.stringify).join("\n");
    return `${header}\n${events}\n`;
  }

  function recording(src, _ref, _ref2) {
    let {
      feed,
      resize,
      onInput,
      onMarker,
      now,
      setTimeout,
      setState,
      logger
    } = _ref;
    let {
      idleTimeLimit,
      startAt,
      loop,
      posterTime,
      markers: markers_,
      pauseOnMarkers,
      cols: initialCols,
      rows: initialRows
    } = _ref2;
    let cols;
    let rows;
    let events;
    let markers;
    let duration;
    let effectiveStartAt;
    let eventTimeoutId;
    let nextEventIndex = 0;
    let lastEventTime = 0;
    let startTime;
    let pauseElapsedTime;
    let playCount = 0;
    async function init() {
      const {
        parser,
        minFrameTime,
        inputOffset,
        dumpFilename,
        encoding = "utf-8"
      } = src;
      const recording = prepare(await parser(await doFetch(src), {
        encoding
      }), logger, {
        idleTimeLimit,
        startAt,
        minFrameTime,
        inputOffset,
        markers_
      });
      ({
        cols,
        rows,
        events,
        duration,
        effectiveStartAt
      } = recording);
      initialCols = initialCols ?? cols;
      initialRows = initialRows ?? rows;
      if (events.length === 0) {
        throw "recording is missing events";
      }
      if (dumpFilename !== undefined) {
        dump(recording, dumpFilename);
      }
      const poster = posterTime !== undefined ? getPoster(posterTime) : undefined;
      markers = events.filter(e => e[1] === "m").map(e => [e[0], e[2].label]);
      return {
        cols,
        rows,
        duration,
        theme: recording.theme,
        poster,
        markers
      };
    }
    function doFetch(_ref3) {
      let {
        url,
        data,
        fetchOpts = {}
      } = _ref3;
      if (typeof url === "string") {
        return doFetchOne(url, fetchOpts);
      } else if (Array.isArray(url)) {
        return Promise.all(url.map(url => doFetchOne(url, fetchOpts)));
      } else if (data !== undefined) {
        if (typeof data === "function") {
          data = data();
        }
        if (!(data instanceof Promise)) {
          data = Promise.resolve(data);
        }
        return data.then(value => {
          if (typeof value === "string" || value instanceof ArrayBuffer) {
            return new Response(value);
          } else {
            return value;
          }
        });
      } else {
        throw "failed fetching recording file: url/data missing in src";
      }
    }
    async function doFetchOne(url, fetchOpts) {
      const response = await fetch(url, fetchOpts);
      if (!response.ok) {
        throw `failed fetching recording from ${url}: ${response.status} ${response.statusText}`;
      }
      return response;
    }
    function delay(targetTime) {
      let delay = targetTime * 1000 - (now() - startTime);
      if (delay < 0) {
        delay = 0;
      }
      return delay;
    }
    function scheduleNextEvent() {
      const nextEvent = events[nextEventIndex];
      if (nextEvent) {
        eventTimeoutId = setTimeout(runNextEvent, delay(nextEvent[0]));
      } else {
        onEnd();
      }
    }
    function runNextEvent() {
      let event = events[nextEventIndex];
      let elapsedWallTime;
      do {
        lastEventTime = event[0];
        nextEventIndex++;
        const stop = executeEvent(event);
        if (stop) {
          return;
        }
        event = events[nextEventIndex];
        elapsedWallTime = now() - startTime;
      } while (event && elapsedWallTime > event[0] * 1000);
      scheduleNextEvent();
    }
    function cancelNextEvent() {
      clearTimeout(eventTimeoutId);
      eventTimeoutId = null;
    }
    function executeEvent(event) {
      const [time, type, data] = event;
      if (type === "o") {
        feed(data);
      } else if (type === "i") {
        onInput(data);
      } else if (type === "r") {
        const [cols, rows] = data.split("x");
        resize(cols, rows);
      } else if (type === "m") {
        onMarker(data);
        if (pauseOnMarkers) {
          pause();
          pauseElapsedTime = time * 1000;
          setState("idle", {
            reason: "paused"
          });
          return true;
        }
      }
      return false;
    }
    function onEnd() {
      cancelNextEvent();
      playCount++;
      if (loop === true || typeof loop === "number" && playCount < loop) {
        nextEventIndex = 0;
        startTime = now();
        feed("\x1bc"); // reset terminal
        resizeTerminalToInitialSize();
        scheduleNextEvent();
      } else {
        pauseElapsedTime = duration * 1000;
        setState("ended");
      }
    }
    function play() {
      if (eventTimeoutId) throw "already playing";
      if (events[nextEventIndex] === undefined) throw "already ended";
      if (effectiveStartAt !== null) {
        seek(effectiveStartAt);
      }
      resume();
      return true;
    }
    function pause() {
      if (!eventTimeoutId) return true;
      cancelNextEvent();
      pauseElapsedTime = now() - startTime;
      return true;
    }
    function resume() {
      startTime = now() - pauseElapsedTime;
      pauseElapsedTime = null;
      scheduleNextEvent();
    }
    function seek(where) {
      const isPlaying = !!eventTimeoutId;
      pause();
      const currentTime = (pauseElapsedTime ?? 0) / 1000;
      if (typeof where === "string") {
        if (where === "<<") {
          where = currentTime - 5;
        } else if (where === ">>") {
          where = currentTime + 5;
        } else if (where === "<<<") {
          where = currentTime - 0.1 * duration;
        } else if (where === ">>>") {
          where = currentTime + 0.1 * duration;
        } else if (where[where.length - 1] === "%") {
          where = parseFloat(where.substring(0, where.length - 1)) / 100 * duration;
        }
      } else if (typeof where === "object") {
        if (where.marker === "prev") {
          where = findMarkerTimeBefore(currentTime) ?? 0;
          if (isPlaying && currentTime - where < 1) {
            where = findMarkerTimeBefore(where) ?? 0;
          }
        } else if (where.marker === "next") {
          where = findMarkerTimeAfter(currentTime) ?? duration;
        } else if (typeof where.marker === "number") {
          const marker = markers[where.marker];
          if (marker === undefined) {
            throw `invalid marker index: ${where.marker}`;
          } else {
            where = marker[0];
          }
        }
      }
      const targetTime = Math.min(Math.max(where, 0), duration);
      if (targetTime < lastEventTime) {
        feed("\x1bc"); // reset terminal
        resizeTerminalToInitialSize();
        nextEventIndex = 0;
        lastEventTime = 0;
      }
      let event = events[nextEventIndex];
      while (event && event[0] <= targetTime) {
        if (event[1] === "o") {
          executeEvent(event);
        }
        lastEventTime = event[0];
        event = events[++nextEventIndex];
      }
      pauseElapsedTime = targetTime * 1000;
      effectiveStartAt = null;
      if (isPlaying) {
        resume();
      }
      return true;
    }
    function findMarkerTimeBefore(time) {
      if (markers.length == 0) return;
      let i = 0;
      let marker = markers[i];
      let lastMarkerTimeBefore;
      while (marker && marker[0] < time) {
        lastMarkerTimeBefore = marker[0];
        marker = markers[++i];
      }
      return lastMarkerTimeBefore;
    }
    function findMarkerTimeAfter(time) {
      if (markers.length == 0) return;
      let i = markers.length - 1;
      let marker = markers[i];
      let firstMarkerTimeAfter;
      while (marker && marker[0] > time) {
        firstMarkerTimeAfter = marker[0];
        marker = markers[--i];
      }
      return firstMarkerTimeAfter;
    }
    function step(n) {
      if (n === undefined) {
        n = 1;
      }
      let nextEvent;
      let targetIndex;
      if (n > 0) {
        let index = nextEventIndex;
        nextEvent = events[index];
        for (let i = 0; i < n; i++) {
          while (nextEvent !== undefined && nextEvent[1] !== "o") {
            nextEvent = events[++index];
          }
          if (nextEvent !== undefined && nextEvent[1] === "o") {
            targetIndex = index;
          }
        }
      } else {
        let index = Math.max(nextEventIndex - 2, 0);
        nextEvent = events[index];
        for (let i = n; i < 0; i++) {
          while (nextEvent !== undefined && nextEvent[1] !== "o") {
            nextEvent = events[--index];
          }
          if (nextEvent !== undefined && nextEvent[1] === "o") {
            targetIndex = index;
          }
        }
        if (targetIndex !== undefined) {
          feed("\x1bc"); // reset terminal
          resizeTerminalToInitialSize();
          nextEventIndex = 0;
        }
      }
      if (targetIndex === undefined) return;
      while (nextEventIndex <= targetIndex) {
        nextEvent = events[nextEventIndex++];
        if (nextEvent[1] === "o") {
          executeEvent(nextEvent);
        }
      }
      lastEventTime = nextEvent[0];
      pauseElapsedTime = lastEventTime * 1000;
      effectiveStartAt = null;
      if (events[targetIndex + 1] === undefined) {
        onEnd();
      }
    }
    function restart() {
      if (eventTimeoutId) throw "still playing";
      if (events[nextEventIndex] !== undefined) throw "not ended";
      seek(0);
      resume();
      return true;
    }
    function getPoster(time) {
      return events.filter(e => e[0] < time && e[1] === "o").map(e => e[2]);
    }
    function getCurrentTime() {
      if (eventTimeoutId) {
        return (now() - startTime) / 1000;
      } else {
        return (pauseElapsedTime ?? 0) / 1000;
      }
    }
    function resizeTerminalToInitialSize() {
      resize(initialCols, initialRows);
    }
    return {
      init,
      play,
      pause,
      seek,
      step,
      restart,
      stop: pause,
      getCurrentTime
    };
  }
  function batcher(logger) {
    let minFrameTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0 / 60;
    let prevEvent;
    return emit => {
      let ic = 0;
      let oc = 0;
      return {
        step: event => {
          ic++;
          if (prevEvent === undefined) {
            prevEvent = event;
            return;
          }
          if (event[1] === "o" && prevEvent[1] === "o" && event[0] - prevEvent[0] < minFrameTime) {
            prevEvent[2] += event[2];
          } else {
            emit(prevEvent);
            prevEvent = event;
            oc++;
          }
        },
        flush: () => {
          if (prevEvent !== undefined) {
            emit(prevEvent);
            oc++;
          }
          logger.debug(`batched ${ic} frames to ${oc} frames`);
        }
      };
    };
  }
  function prepare(recording, logger, _ref4) {
    let {
      startAt = 0,
      idleTimeLimit,
      minFrameTime,
      inputOffset,
      markers_
    } = _ref4;
    let {
      events
    } = recording;
    if (!(events instanceof Stream)) {
      events = new Stream(events);
    }
    idleTimeLimit = idleTimeLimit ?? recording.idleTimeLimit ?? Infinity;
    const limiterOutput = {
      offset: 0
    };
    events = events.transform(batcher(logger, minFrameTime)).map(timeLimiter(idleTimeLimit, startAt, limiterOutput)).map(markerWrapper());
    if (markers_ !== undefined) {
      markers_ = new Stream(markers_).map(normalizeMarker);
      events = events.filter(e => e[1] !== "m").multiplex(markers_, (a, b) => a[0] < b[0]).map(markerWrapper());
    }
    events = events.toArray();
    if (inputOffset !== undefined) {
      events = events.map(e => e[1] === "i" ? [e[0] + inputOffset, e[1], e[2]] : e);
      events.sort((a, b) => a[0] - b[0]);
    }
    const duration = events[events.length - 1][0];
    const effectiveStartAt = startAt - limiterOutput.offset;
    return {
      ...recording,
      events,
      duration,
      effectiveStartAt
    };
  }
  function normalizeMarker(m) {
    return typeof m === "number" ? [m, "m", ""] : [m[0], "m", m[1]];
  }
  function timeLimiter(idleTimeLimit, startAt, output) {
    let prevT = 0;
    let shift = 0;
    return function (e) {
      const delay = e[0] - prevT;
      const delta = delay - idleTimeLimit;
      prevT = e[0];
      if (delta > 0) {
        shift += delta;
        if (e[0] < startAt) {
          output.offset += delta;
        }
      }
      return [e[0] - shift, e[1], e[2]];
    };
  }
  function markerWrapper() {
    let i = 0;
    return function (e) {
      if (e[1] === "m") {
        return [e[0], e[1], {
          index: i++,
          time: e[0],
          label: e[2]
        }];
      } else {
        return e;
      }
    };
  }
  function dump(recording, filename) {
    const link = document.createElement("a");
    const events = recording.events.map(e => e[1] === "m" ? [e[0], e[1], e[2].label] : e);
    const asciicast = unparseAsciicastV2({
      ...recording,
      events
    });
    link.href = URL.createObjectURL(new Blob([asciicast], {
      type: "text/plain"
    }));
    link.download = filename;
    link.click();
  }

  function clock(_ref, _ref2, _ref3) {
    let {
      hourColor = 3,
      minuteColor = 4,
      separatorColor = 9
    } = _ref;
    let {
      feed
    } = _ref2;
    let {
      cols = 5,
      rows = 1
    } = _ref3;
    const middleRow = Math.floor(rows / 2);
    const leftPad = Math.floor(cols / 2) - 2;
    const setupCursor = `\x1b[?25l\x1b[1m\x1b[${middleRow}B`;
    let intervalId;
    const getCurrentTime = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes();
      const seqs = [];
      seqs.push("\r");
      for (let i = 0; i < leftPad; i++) {
        seqs.push(" ");
      }
      seqs.push(`\x1b[3${hourColor}m`);
      if (h < 10) {
        seqs.push("0");
      }
      seqs.push(`${h}`);
      seqs.push(`\x1b[3${separatorColor};5m:\x1b[25m`);
      seqs.push(`\x1b[3${minuteColor}m`);
      if (m < 10) {
        seqs.push("0");
      }
      seqs.push(`${m}`);
      return seqs;
    };
    const updateTime = () => {
      getCurrentTime().forEach(feed);
    };
    return {
      init: () => {
        const duration = 24 * 60;
        const poster = [setupCursor].concat(getCurrentTime());
        return {
          cols,
          rows,
          duration,
          poster
        };
      },
      play: () => {
        feed(setupCursor);
        updateTime();
        intervalId = setInterval(updateTime, 1000);
        return true;
      },
      stop: () => {
        clearInterval(intervalId);
      },
      getCurrentTime: () => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
      }
    };
  }

  function random(src, _ref) {
    let {
      feed,
      setTimeout
    } = _ref;
    const base = " ".charCodeAt(0);
    const range = "~".charCodeAt(0) - base;
    let timeoutId;
    const schedule = () => {
      const t = Math.pow(5, Math.random() * 4);
      timeoutId = setTimeout(print, t);
    };
    const print = () => {
      schedule();
      const char = String.fromCharCode(base + Math.floor(Math.random() * range));
      feed(char);
    };
    return () => {
      schedule();
      return () => clearInterval(timeoutId);
    };
  }

  function benchmark(_ref, _ref2) {
    let {
      url,
      iterations = 10
    } = _ref;
    let {
      feed,
      setState,
      now
    } = _ref2;
    let data;
    let byteCount = 0;
    return {
      async init() {
        const recording = await parse$2(await fetch(url));
        const {
          cols,
          rows,
          events
        } = recording;
        data = Array.from(events).filter(_ref3 => {
          let [_time, type, _text] = _ref3;
          return type === "o";
        }).map(_ref4 => {
          let [time, _type, text] = _ref4;
          return [time, text];
        });
        const duration = data[data.length - 1][0];
        for (const [_, text] of data) {
          byteCount += new Blob([text]).size;
        }
        return {
          cols,
          rows,
          duration
        };
      },
      play() {
        const startTime = now();
        for (let i = 0; i < iterations; i++) {
          for (const [_, text] of data) {
            feed(text);
          }
          feed("\x1bc"); // reset terminal
        }

        const endTime = now();
        const duration = (endTime - startTime) / 1000;
        const throughput = byteCount * iterations / duration;
        const throughputMbs = byteCount / (1024 * 1024) * iterations / duration;
        console.info("benchmark: result", {
          byteCount,
          iterations,
          duration,
          throughput,
          throughputMbs
        });
        setTimeout(() => {
          setState("stopped", {
            reason: "ended"
          });
        }, 0);
        return true;
      }
    };
  }

  class Queue {
    constructor() {
      this.items = [];
      this.onPush = undefined;
    }
    push(item) {
      this.items.push(item);
      if (this.onPush !== undefined) {
        this.onPush(this.popAll());
        this.onPush = undefined;
      }
    }
    popAll() {
      if (this.items.length > 0) {
        const items = this.items;
        this.items = [];
        return items;
      } else {
        const thiz = this;
        return new Promise(resolve => {
          thiz.onPush = resolve;
        });
      }
    }
  }

  function getBuffer(bufferTime, feed, resize, setTime, baseStreamTime, minFrameTime, logger) {
    const execute = executeEvent(feed, resize);
    if (bufferTime === 0) {
      logger.debug("using no buffer");
      return nullBuffer(execute);
    } else {
      bufferTime = bufferTime ?? {};
      let getBufferTime;
      if (typeof bufferTime === "number") {
        logger.debug(`using fixed time buffer (${bufferTime} ms)`);
        getBufferTime = _latency => bufferTime;
      } else if (typeof bufferTime === "function") {
        logger.debug("using custom dynamic buffer");
        getBufferTime = bufferTime({
          logger
        });
      } else {
        logger.debug("using adaptive buffer", bufferTime);
        getBufferTime = adaptiveBufferTimeProvider({
          logger
        }, bufferTime);
      }
      return buffer(getBufferTime, execute, setTime, logger, baseStreamTime ?? 0.0, minFrameTime);
    }
  }
  function nullBuffer(execute) {
    return {
      pushEvent(event) {
        execute(event[1], event[2]);
      },
      pushText(text) {
        execute("o", text);
      },
      stop() {}
    };
  }
  function executeEvent(feed, resize) {
    return function (code, data) {
      if (code === "o") {
        feed(data);
      } else if (code === "r") {
        resize(data.cols, data.rows);
      }
    };
  }
  function buffer(getBufferTime, execute, setTime, logger, baseStreamTime) {
    let minFrameTime = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1.0 / 60;
    let epoch = performance.now() - baseStreamTime * 1000;
    let bufferTime = getBufferTime(0);
    const queue = new Queue();
    minFrameTime *= 1000;
    let prevElapsedStreamTime = -minFrameTime;
    let stop = false;
    function elapsedWallTime() {
      return performance.now() - epoch;
    }
    setTimeout(async () => {
      while (!stop) {
        const events = await queue.popAll();
        if (stop) return;
        for (const event of events) {
          const elapsedStreamTime = event[0] * 1000 + bufferTime;
          if (elapsedStreamTime - prevElapsedStreamTime < minFrameTime) {
            execute(event[1], event[2]);
            continue;
          }
          const delay = elapsedStreamTime - elapsedWallTime();
          if (delay > 0) {
            await sleep(delay);
            if (stop) return;
          }
          setTime(event[0]);
          execute(event[1], event[2]);
          prevElapsedStreamTime = elapsedStreamTime;
        }
      }
    }, 0);
    return {
      pushEvent(event) {
        let latency = elapsedWallTime() - event[0] * 1000;
        if (latency < 0) {
          logger.debug(`correcting epoch by ${latency} ms`);
          epoch += latency;
          latency = 0;
        }
        bufferTime = getBufferTime(latency);
        queue.push(event);
      },
      pushText(text) {
        queue.push([elapsedWallTime() / 1000, "o", text]);
      },
      stop() {
        stop = true;
        queue.push(undefined);
      }
    };
  }
  function sleep(t) {
    return new Promise(resolve => {
      setTimeout(resolve, t);
    });
  }
  function adaptiveBufferTimeProvider(_ref, _ref2) {
    let {
      logger
    } = _ref;
    let {
      minTime = 25,
      maxLevel = 100,
      interval = 50,
      windowSize = 20,
      smoothingFactor = 0.2,
      minImprovementDuration = 1000
    } = _ref2;
    let bufferLevel = 0;
    let bufferTime = calcBufferTime(bufferLevel);
    let latencies = [];
    let maxJitter = 0;
    let jitterRange = 0;
    let improvementTs = null;
    function calcBufferTime(level) {
      if (level === 0) {
        return minTime;
      } else {
        return interval * level;
      }
    }
    return latency => {
      latencies.push(latency);
      if (latencies.length < windowSize) {
        return bufferTime;
      }
      latencies = latencies.slice(-windowSize);
      const currentMinJitter = min(latencies);
      const currentMaxJitter = max(latencies);
      const currentJitterRange = currentMaxJitter - currentMinJitter;
      maxJitter = currentMaxJitter * smoothingFactor + maxJitter * (1 - smoothingFactor);
      jitterRange = currentJitterRange * smoothingFactor + jitterRange * (1 - smoothingFactor);
      const minBufferTime = maxJitter + jitterRange;
      if (latency > bufferTime) {
        logger.debug('buffer underrun', {
          latency,
          maxJitter,
          jitterRange,
          bufferTime
        });
      }
      if (bufferLevel < maxLevel && minBufferTime > bufferTime) {
        bufferTime = calcBufferTime(bufferLevel += 1);
        logger.debug(`jitter increased, raising bufferTime`, {
          latency,
          maxJitter,
          jitterRange,
          bufferTime
        });
      } else if (bufferLevel > 1 && minBufferTime < calcBufferTime(bufferLevel - 2) || bufferLevel == 1 && minBufferTime < calcBufferTime(bufferLevel - 1)) {
        if (improvementTs === null) {
          improvementTs = performance.now();
        } else if (performance.now() - improvementTs > minImprovementDuration) {
          improvementTs = performance.now();
          bufferTime = calcBufferTime(bufferLevel -= 1);
          logger.debug(`jitter decreased, lowering bufferTime`, {
            latency,
            maxJitter,
            jitterRange,
            bufferTime
          });
        }
        return bufferTime;
      }
      improvementTs = null;
      return bufferTime;
    };
  }
  function min(numbers) {
    return numbers.reduce((prev, cur) => cur < prev ? cur : prev);
  }
  function max(numbers) {
    return numbers.reduce((prev, cur) => cur > prev ? cur : prev);
  }

  const ONE_SEC_IN_USEC = 1000000;
  function alisHandler(logger) {
    const outputDecoder = new TextDecoder();
    const inputDecoder = new TextDecoder();
    let handler = parseMagicString;
    let lastEventTime;
    function parseMagicString(buffer) {
      const text = new TextDecoder().decode(buffer);
      if (text === "ALiS\x01") {
        handler = parseInitFrame;
      } else {
        throw "not an ALiS v1 live stream";
      }
    }
    function parseInitFrame(buffer) {
      const view = new BinaryReader(new DataView(buffer));
      const type = view.getUint8();
      if (type !== 0x01) throw `expected init (0x01) frame, got ${type}`;
      let time = view.decodeVarUint();
      lastEventTime = time;
      time = time / ONE_SEC_IN_USEC;
      const cols = view.decodeVarUint();
      const rows = view.decodeVarUint();
      const themeFormat = view.getUint8();
      let theme;
      if (themeFormat === 8) {
        const len = (2 + 8) * 3;
        theme = parseTheme(new Uint8Array(buffer, view.offset, len));
        view.forward(len);
      } else if (themeFormat === 16) {
        const len = (2 + 16) * 3;
        theme = parseTheme(new Uint8Array(buffer, view.offset, len));
        view.forward(len);
      } else if (themeFormat !== 0) {
        logger.warn(`alis: unsupported theme format (${themeFormat})`);
        socket.close();
        return;
      }
      const initLen = view.decodeVarUint();
      let init;
      if (initLen > 0) {
        init = outputDecoder.decode(new Uint8Array(buffer, view.offset, initLen));
      }
      handler = parseEventFrame;
      return {
        time,
        term: {
          size: {
            cols,
            rows
          },
          theme,
          init
        }
      };
    }
    function parseEventFrame(buffer) {
      const view = new BinaryReader(new DataView(buffer));
      const type = view.getUint8();
      if (type === 0x6f) {
        // 'o' - output
        const relTime = view.decodeVarUint();
        lastEventTime += relTime;
        const len = view.decodeVarUint();
        const text = outputDecoder.decode(new Uint8Array(buffer, view.offset, len));
        return [lastEventTime / ONE_SEC_IN_USEC, "o", text];
      } else if (type === 0x69) {
        // 'i' - input
        const relTime = view.decodeVarUint();
        lastEventTime += relTime;
        const len = view.decodeVarUint();
        const text = inputDecoder.decode(new Uint8Array(buffer, view.offset, len));
        return [lastEventTime / ONE_SEC_IN_USEC, "i", text];
      } else if (type === 0x72) {
        // 'r' - resize
        const relTime = view.decodeVarUint();
        lastEventTime += relTime;
        const cols = view.decodeVarUint();
        const rows = view.decodeVarUint();
        return [lastEventTime / ONE_SEC_IN_USEC, "r", {
          cols,
          rows
        }];
      } else if (type === 0x6d) {
        // 'm' - marker
        const relTime = view.decodeVarUint();
        lastEventTime += relTime;
        const len = view.decodeVarUint();
        const decoder = new TextDecoder();
        const text = decoder.decode(new Uint8Array(buffer, view.offset, len));
        return [lastEventTime / ONE_SEC_IN_USEC, "m", text];
      } else if (type === 0x04) {
        // EOT
        handler = parseInitFrame;
        return false;
      } else {
        logger.debug(`alis: unknown frame type: ${type}`);
      }
    }
    return function (buffer) {
      return handler(buffer);
    };
  }
  function parseTheme(arr) {
    const colorCount = arr.length / 3;
    const foreground = hexColor(arr[0], arr[1], arr[2]);
    const background = hexColor(arr[3], arr[4], arr[5]);
    const palette = [];
    for (let i = 2; i < colorCount; i++) {
      palette.push(hexColor(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]));
    }
    return {
      foreground,
      background,
      palette
    };
  }
  function hexColor(r, g, b) {
    return `#${byteToHex(r)}${byteToHex(g)}${byteToHex(b)}`;
  }
  function byteToHex(value) {
    return value.toString(16).padStart(2, "0");
  }
  class BinaryReader {
    constructor(inner) {
      let offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      this.inner = inner;
      this.offset = offset;
    }
    forward(delta) {
      this.offset += delta;
    }
    getUint8() {
      const value = this.inner.getUint8(this.offset);
      this.offset += 1;
      return value;
    }
    decodeVarUint() {
      let number = 0;
      let shift = 0;
      let byte = this.getUint8();
      while (byte > 127) {
        byte &= 127;
        number += byte << shift;
        shift += 7;
        byte = this.getUint8();
      }
      return number + (byte << shift);
    }
  }

  function jsonHandler() {
    let parse = parseHeader;
    function parseHeader(buffer) {
      const header = JSON.parse(buffer);
      if (header.version !== 2) {
        throw "not an asciicast v2 stream";
      }
      parse = parseEvent;
      return {
        time: 0.0,
        term: {
          size: {
            cols: header.width,
            rows: header.height
          }
        }
      };
    }
    function parseEvent(buffer) {
      const event = JSON.parse(buffer);
      if (event[1] === "r") {
        const [cols, rows] = event[2].split("x");
        return [event[0], "r", {
          cols,
          rows
        }];
      } else {
        return event;
      }
    }
    return function (buffer) {
      return parse(buffer);
    };
  }

  function rawHandler() {
    const outputDecoder = new TextDecoder();
    let parse = parseSize;
    function parseSize(buffer) {
      const text = outputDecoder.decode(buffer, {
        stream: true
      });
      const [cols, rows] = sizeFromResizeSeq(text) ?? sizeFromScriptStartMessage(text) ?? [80, 24];
      parse = parseOutput;
      return {
        time: 0.0,
        term: {
          size: {
            cols,
            rows
          },
          init: text
        }
      };
    }
    function parseOutput(buffer) {
      return outputDecoder.decode(buffer, {
        stream: true
      });
    }
    return function (buffer) {
      return parse(buffer);
    };
  }
  function sizeFromResizeSeq(text) {
    const match = text.match(/\x1b\[8;(\d+);(\d+)t/);
    if (match !== null) {
      return [parseInt(match[2], 10), parseInt(match[1], 10)];
    }
  }
  function sizeFromScriptStartMessage(text) {
    const match = text.match(/\[.*COLUMNS="(\d{1,3})" LINES="(\d{1,3})".*\]/);
    if (match !== null) {
      return [parseInt(match[1], 10), parseInt(match[2], 10)];
    }
  }

  function exponentialDelay(attempt) {
    return Math.min(500 * Math.pow(2, attempt), 5000);
  }
  function websocket(_ref, _ref2) {
    let {
      url,
      bufferTime,
      reconnectDelay = exponentialDelay,
      minFrameTime
    } = _ref;
    let {
      feed,
      reset,
      resize,
      setState,
      logger
    } = _ref2;
    logger = new PrefixedLogger(logger, "websocket: ");
    let socket;
    let buf;
    let clock = new NullClock();
    let reconnectAttempt = 0;
    let successfulConnectionTimeout;
    let stop = false;
    let wasOnline = false;
    let initTimeout;
    function connect() {
      socket = new WebSocket(url, ["v1.alis", "v2.asciicast", "raw"]);
      socket.binaryType = "arraybuffer";
      socket.onopen = () => {
        const proto = socket.protocol || "raw";
        logger.info("opened");
        logger.info(`activating ${proto} protocol handler`);
        if (proto === "v1.alis") {
          socket.onmessage = onMessage(alisHandler(logger));
        } else if (proto === "v2.asciicast") {
          socket.onmessage = onMessage(jsonHandler());
        } else if (proto === "raw") {
          socket.onmessage = onMessage(rawHandler());
        }
        successfulConnectionTimeout = setTimeout(() => {
          reconnectAttempt = 0;
        }, 1000);
      };
      socket.onclose = event => {
        clearTimeout(initTimeout);
        stopBuffer();
        if (stop || event.code === 1000 || event.code === 1005) {
          logger.info("closed");
          setState("ended", {
            message: "Stream ended"
          });
        } else if (event.code === 1002) {
          logger.debug(`close reason: ${event.reason}`);
          setState("ended", {
            message: "Err: Player not compatible with the server"
          });
        } else {
          clearTimeout(successfulConnectionTimeout);
          const delay = reconnectDelay(reconnectAttempt++);
          logger.info(`unclean close, reconnecting in ${delay}...`);
          setState("loading");
          setTimeout(connect, delay);
        }
      };
      wasOnline = false;
    }
    function onMessage(handler) {
      initTimeout = setTimeout(enterOfflineMode, 5000);
      return function (event) {
        const result = handler(event.data);
        if (buf) {
          if (Array.isArray(result)) {
            buf.pushEvent(result);
          } else if (typeof result === "string") {
            buf.pushText(result);
          } else if (result === false) {
            // EOT
            enterOfflineMode();
          } else if (result !== undefined) {
            throw `unexpected value from protocol handler: ${result}`;
          }
        } else {
          if (typeof result === "object" && !Array.isArray(result)) {
            const {
              time,
              term
            } = result;
            const {
              size,
              init,
              theme
            } = term;
            const {
              cols,
              rows
            } = size;
            enterOnlineMode(cols, rows, time, init, theme);
            clearTimeout(initTimeout);
          } else if (result === undefined) {
            clearTimeout(initTimeout);
            initTimeout = setTimeout(enterOfflineMode, 1000);
          } else {
            clearTimeout(initTimeout);
            throw `unexpected value from protocol handler: ${result}`;
          }
        }
      };
    }
    function enterOnlineMode(cols, rows, time, init, theme) {
      logger.info(`stream init (${cols}x${rows} @${time})`);
      setState("playing");
      stopBuffer();
      buf = getBuffer(bufferTime, feed, resize, t => clock.setTime(t), time, minFrameTime, logger);
      reset(cols, rows, init, theme);
      clock = new Clock();
      wasOnline = true;
      if (typeof time === "number") {
        clock.setTime(time);
      }
    }
    function enterOfflineMode() {
      stopBuffer();
      if (wasOnline) {
        logger.info("stream ended");
        setState("offline", {
          message: "Stream ended"
        });
      } else {
        logger.info("stream offline");
        setState("offline", {
          message: "Stream offline"
        });
      }
      clock = new NullClock();
    }
    function stopBuffer() {
      if (buf) buf.stop();
      buf = null;
    }
    return {
      play: () => {
        connect();
      },
      stop: () => {
        stop = true;
        stopBuffer();
        if (socket !== undefined) socket.close();
      },
      getCurrentTime: () => clock.getTime()
    };
  }

  function eventsource(_ref, _ref2) {
    let {
      url,
      bufferTime,
      minFrameTime
    } = _ref;
    let {
      feed,
      reset,
      setState,
      logger
    } = _ref2;
    logger = new PrefixedLogger(logger, "eventsource: ");
    let es;
    let buf;
    let clock = new NullClock();
    function initBuffer(baseStreamTime) {
      if (buf !== undefined) buf.stop();
      buf = getBuffer(bufferTime, feed, t => clock.setTime(t), baseStreamTime, minFrameTime, logger);
    }
    return {
      play: () => {
        es = new EventSource(url);
        es.addEventListener("open", () => {
          logger.info("opened");
          initBuffer();
        });
        es.addEventListener("error", e => {
          logger.info("errored");
          logger.debug({
            e
          });
          setState("loading");
        });
        es.addEventListener("message", event => {
          const e = JSON.parse(event.data);
          if (Array.isArray(e)) {
            buf.pushEvent(e);
          } else if (e.cols !== undefined || e.width !== undefined) {
            const cols = e.cols ?? e.width;
            const rows = e.rows ?? e.height;
            logger.debug(`vt reset (${cols}x${rows})`);
            setState("playing");
            initBuffer(e.time);
            reset(cols, rows, e.init ?? undefined);
            clock = new Clock();
            if (typeof e.time === "number") {
              clock.setTime(e.time);
            }
          } else if (e.state === "offline") {
            logger.info("stream offline");
            setState("offline", {
              message: "Stream offline"
            });
            clock = new NullClock();
          }
        });
        es.addEventListener("done", () => {
          logger.info("closed");
          es.close();
          setState("ended", {
            message: "Stream ended"
          });
        });
      },
      stop: () => {
        if (buf !== undefined) buf.stop();
        if (es !== undefined) es.close();
      },
      getCurrentTime: () => clock.getTime()
    };
  }

  async function parse$1(responses, _ref) {
    let {
      encoding
    } = _ref;
    const textDecoder = new TextDecoder(encoding);
    let cols;
    let rows;
    let timing = (await responses[0].text()).split("\n").filter(line => line.length > 0).map(line => line.split(" "));
    if (timing[0].length < 3) {
      timing = timing.map(entry => ["O", entry[0], entry[1]]);
    }
    const buffer = await responses[1].arrayBuffer();
    const array = new Uint8Array(buffer);
    const dataOffset = array.findIndex(byte => byte == 0x0a) + 1;
    const header = textDecoder.decode(array.subarray(0, dataOffset));
    const sizeMatch = header.match(/COLUMNS="(\d+)" LINES="(\d+)"/);
    if (sizeMatch !== null) {
      cols = parseInt(sizeMatch[1], 10);
      rows = parseInt(sizeMatch[2], 10);
    }
    const stdout = {
      array,
      cursor: dataOffset
    };
    let stdin = stdout;
    if (responses[2] !== undefined) {
      const buffer = await responses[2].arrayBuffer();
      const array = new Uint8Array(buffer);
      stdin = {
        array,
        cursor: dataOffset
      };
    }
    const events = [];
    let time = 0;
    for (const entry of timing) {
      time += parseFloat(entry[1]);
      if (entry[0] === "O") {
        const count = parseInt(entry[2], 10);
        const bytes = stdout.array.subarray(stdout.cursor, stdout.cursor + count);
        const text = textDecoder.decode(bytes);
        events.push([time, "o", text]);
        stdout.cursor += count;
      } else if (entry[0] === "I") {
        const count = parseInt(entry[2], 10);
        const bytes = stdin.array.subarray(stdin.cursor, stdin.cursor + count);
        const text = textDecoder.decode(bytes);
        events.push([time, "i", text]);
        stdin.cursor += count;
      } else if (entry[0] === "S" && entry[2] === "SIGWINCH") {
        const cols = parseInt(entry[4].slice(5), 10);
        const rows = parseInt(entry[3].slice(5), 10);
        events.push([time, "r", `${cols}x${rows}`]);
      } else if (entry[0] === "H" && entry[2] === "COLUMNS") {
        cols = parseInt(entry[3], 10);
      } else if (entry[0] === "H" && entry[2] === "LINES") {
        rows = parseInt(entry[3], 10);
      }
    }
    cols = cols ?? 80;
    rows = rows ?? 24;
    return {
      cols,
      rows,
      events
    };
  }

  async function parse(response, _ref) {
    let {
      encoding
    } = _ref;
    const textDecoder = new TextDecoder(encoding);
    const buffer = await response.arrayBuffer();
    const array = new Uint8Array(buffer);
    const firstFrame = parseFrame(array);
    const baseTime = firstFrame.time;
    const firstFrameText = textDecoder.decode(firstFrame.data);
    const sizeMatch = firstFrameText.match(/\x1b\[8;(\d+);(\d+)t/);
    const events = [];
    let cols = 80;
    let rows = 24;
    if (sizeMatch !== null) {
      cols = parseInt(sizeMatch[2], 10);
      rows = parseInt(sizeMatch[1], 10);
    }
    let cursor = 0;
    let frame = parseFrame(array);
    while (frame !== undefined) {
      const time = frame.time - baseTime;
      const text = textDecoder.decode(frame.data);
      events.push([time, "o", text]);
      cursor += frame.len;
      frame = parseFrame(array.subarray(cursor));
    }
    return {
      cols,
      rows,
      events
    };
  }
  function parseFrame(array) {
    if (array.length < 13) return;
    const time = parseTimestamp(array.subarray(0, 8));
    const len = parseNumber(array.subarray(8, 12));
    const data = array.subarray(12, 12 + len);
    return {
      time,
      data,
      len: len + 12
    };
  }
  function parseNumber(array) {
    return array[0] + array[1] * 256 + array[2] * 256 * 256 + array[3] * 256 * 256 * 256;
  }
  function parseTimestamp(array) {
    const sec = parseNumber(array.subarray(0, 4));
    const usec = parseNumber(array.subarray(4, 8));
    return sec + usec / 1000000;
  }

  const vt = loadVt(); // trigger async loading of wasm

  class State {
    constructor(core) {
      this.core = core;
      this.driver = core.driver;
    }
    onEnter(data) {}
    init() {}
    play() {}
    pause() {}
    togglePlay() {}
    seek(where) {
      return false;
    }
    step(n) {}
    stop() {
      this.driver.stop();
    }
  }
  class UninitializedState extends State {
    async init() {
      try {
        await this.core._initializeDriver();
        return this.core._setState("idle");
      } catch (e) {
        this.core._setState("errored");
        throw e;
      }
    }
    async play() {
      this.core._dispatchEvent("play");
      const idleState = await this.init();
      await idleState.doPlay();
    }
    async togglePlay() {
      await this.play();
    }
    async seek(where) {
      const idleState = await this.init();
      return await idleState.seek(where);
    }
    async step(n) {
      const idleState = await this.init();
      await idleState.step(n);
    }
    stop() {}
  }
  class Idle extends State {
    onEnter(_ref) {
      let {
        reason,
        message
      } = _ref;
      this.core._dispatchEvent("idle", {
        message
      });
      if (reason === "paused") {
        this.core._dispatchEvent("pause");
      }
    }
    async play() {
      this.core._dispatchEvent("play");
      await this.doPlay();
    }
    async doPlay() {
      const stop = await this.driver.play();
      if (stop === true) {
        this.core._setState("playing");
      } else if (typeof stop === "function") {
        this.core._setState("playing");
        this.driver.stop = stop;
      }
    }
    async togglePlay() {
      await this.play();
    }
    seek(where) {
      return this.driver.seek(where);
    }
    step(n) {
      this.driver.step(n);
    }
  }
  class PlayingState extends State {
    onEnter() {
      this.core._dispatchEvent("playing");
    }
    pause() {
      if (this.driver.pause() === true) {
        this.core._setState("idle", {
          reason: "paused"
        });
      }
    }
    togglePlay() {
      this.pause();
    }
    seek(where) {
      return this.driver.seek(where);
    }
  }
  class LoadingState extends State {
    onEnter() {
      this.core._dispatchEvent("loading");
    }
  }
  class OfflineState extends State {
    onEnter(_ref2) {
      let {
        message
      } = _ref2;
      this.core._dispatchEvent("offline", {
        message
      });
    }
  }
  class EndedState extends State {
    onEnter(_ref3) {
      let {
        message
      } = _ref3;
      this.core._dispatchEvent("ended", {
        message
      });
    }
    async play() {
      this.core._dispatchEvent("play");
      if (await this.driver.restart()) {
        this.core._setState('playing');
      }
    }
    async togglePlay() {
      await this.play();
    }
    seek(where) {
      if (this.driver.seek(where) === true) {
        this.core._setState('idle');
        return true;
      }
      return false;
    }
  }
  class ErroredState extends State {
    onEnter() {
      this.core._dispatchEvent("errored");
    }
  }
  class Core {
    constructor(src, opts) {
      this.src = src;
      this.logger = opts.logger;
      this.state = new UninitializedState(this);
      this.stateName = "uninitialized";
      this.driver = null;
      this.changedLines = new Set();
      this.cursor = undefined;
      this.duration = undefined;
      this.cols = opts.cols;
      this.rows = opts.rows;
      this.speed = opts.speed ?? 1.0;
      this.loop = opts.loop;
      this.idleTimeLimit = opts.idleTimeLimit;
      this.preload = opts.preload;
      this.startAt = parseNpt(opts.startAt);
      this.poster = this._parsePoster(opts.poster);
      this.markers = this._normalizeMarkers(opts.markers);
      this.pauseOnMarkers = opts.pauseOnMarkers;
      this.commandQueue = Promise.resolve();
      this.eventHandlers = new Map([["ended", []], ["errored", []], ["idle", []], ["init", []], ["input", []], ["loading", []], ["marker", []], ["offline", []], ["pause", []], ["play", []], ["playing", []], ["reset", []], ["resize", []], ["seeked", []], ["terminalUpdate", []]]);
    }
    async init() {
      this.wasm = await vt;
      const feed = this._feed.bind(this);
      const onInput = data => {
        this._dispatchEvent("input", {
          data
        });
      };
      const onMarker = _ref4 => {
        let {
          index,
          time,
          label
        } = _ref4;
        this._dispatchEvent("marker", {
          index,
          time,
          label
        });
      };
      const now = this._now.bind(this);
      const reset = this._resetVt.bind(this);
      const resize = this._resizeVt.bind(this);
      const setState = this._setState.bind(this);
      const posterTime = this.poster.type === "npt" ? this.poster.value : undefined;
      this.driver = getDriver(this.src)({
        feed,
        onInput,
        onMarker,
        reset,
        resize,
        now,
        setTimeout: (f, t) => setTimeout(f, t / this.speed),
        setInterval: (f, t) => setInterval(f, t / this.speed),
        setState,
        logger: this.logger
      }, {
        cols: this.cols,
        rows: this.rows,
        idleTimeLimit: this.idleTimeLimit,
        startAt: this.startAt,
        loop: this.loop,
        posterTime: posterTime,
        markers: this.markers,
        pauseOnMarkers: this.pauseOnMarkers
      });
      if (typeof this.driver === "function") {
        this.driver = {
          play: this.driver
        };
      }
      if (this.preload || posterTime !== undefined) {
        this._withState(state => state.init());
      }
      const poster = this.poster.type === "text" ? this._renderPoster(this.poster.value) : undefined;
      const config = {
        isPausable: !!this.driver.pause,
        isSeekable: !!this.driver.seek,
        poster
      };
      if (this.driver.init === undefined) {
        this.driver.init = () => {
          return {};
        };
      }
      if (this.driver.pause === undefined) {
        this.driver.pause = () => {};
      }
      if (this.driver.seek === undefined) {
        this.driver.seek = where => false;
      }
      if (this.driver.step === undefined) {
        this.driver.step = n => {};
      }
      if (this.driver.stop === undefined) {
        this.driver.stop = () => {};
      }
      if (this.driver.restart === undefined) {
        this.driver.restart = () => {};
      }
      if (this.driver.getCurrentTime === undefined) {
        const play = this.driver.play;
        let clock = new NullClock();
        this.driver.play = () => {
          clock = new Clock(this.speed);
          return play();
        };
        this.driver.getCurrentTime = () => clock.getTime();
      }
      return config;
    }
    play() {
      return this._withState(state => state.play());
    }
    pause() {
      return this._withState(state => state.pause());
    }
    togglePlay() {
      return this._withState(state => state.togglePlay());
    }
    seek(where) {
      return this._withState(async state => {
        if (await state.seek(where)) {
          this._dispatchEvent("seeked");
        }
      });
    }
    step(n) {
      return this._withState(state => state.step(n));
    }
    stop() {
      return this._withState(state => state.stop());
    }
    getChanges() {
      const changes = {};
      if (this.changedLines.size > 0) {
        const lines = new Map();
        const rows = this.vt.rows;
        for (const i of this.changedLines) {
          if (i < rows) {
            lines.set(i, {
              id: i,
              segments: this.vt.getLine(i)
            });
          }
        }
        this.changedLines.clear();
        changes.lines = lines;
      }
      if (this.cursor === undefined && this.vt) {
        this.cursor = this.vt.getCursor() ?? false;
        changes.cursor = this.cursor;
      }
      return changes;
    }
    getCurrentTime() {
      return this.driver.getCurrentTime();
    }
    getRemainingTime() {
      if (typeof this.duration === "number") {
        return this.duration - Math.min(this.getCurrentTime(), this.duration);
      }
    }
    getProgress() {
      if (typeof this.duration === "number") {
        return Math.min(this.getCurrentTime(), this.duration) / this.duration;
      }
    }
    getDuration() {
      return this.duration;
    }
    addEventListener(eventName, handler) {
      this.eventHandlers.get(eventName).push(handler);
    }
    _dispatchEvent(eventName) {
      let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      for (const h of this.eventHandlers.get(eventName)) {
        h(data);
      }
    }
    _withState(f) {
      return this._enqueueCommand(() => f(this.state));
    }
    _enqueueCommand(f) {
      this.commandQueue = this.commandQueue.then(f);
      return this.commandQueue;
    }
    _setState(newState) {
      let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (this.stateName === newState) return this.state;
      this.stateName = newState;
      if (newState === "playing") {
        this.state = new PlayingState(this);
      } else if (newState === "idle") {
        this.state = new Idle(this);
      } else if (newState === "loading") {
        this.state = new LoadingState(this);
      } else if (newState === "ended") {
        this.state = new EndedState(this);
      } else if (newState === "offline") {
        this.state = new OfflineState(this);
      } else if (newState === "errored") {
        this.state = new ErroredState(this);
      } else {
        throw `invalid state: ${newState}`;
      }
      this.state.onEnter(data);
      return this.state;
    }
    _feed(data) {
      this._doFeed(data);
      this._dispatchEvent("terminalUpdate");
    }
    _doFeed(data) {
      const affectedLines = this.vt.feed(data);
      affectedLines.forEach(i => this.changedLines.add(i));
      this.cursor = undefined;
    }
    _now() {
      return performance.now() * this.speed;
    }
    async _initializeDriver() {
      const meta = await this.driver.init();
      this.cols = this.cols ?? meta.cols ?? 80;
      this.rows = this.rows ?? meta.rows ?? 24;
      this.duration = this.duration ?? meta.duration;
      this.markers = this._normalizeMarkers(meta.markers) ?? this.markers ?? [];
      if (this.cols === 0) {
        this.cols = 80;
      }
      if (this.rows === 0) {
        this.rows = 24;
      }
      this._initializeVt(this.cols, this.rows);
      const poster = meta.poster !== undefined ? this._renderPoster(meta.poster) : undefined;
      this._dispatchEvent("init", {
        cols: this.cols,
        rows: this.rows,
        duration: this.duration,
        markers: this.markers,
        theme: meta.theme,
        poster
      });
    }
    _resetVt(cols, rows) {
      let init = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
      let theme = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
      this.cols = cols;
      this.rows = rows;
      this.cursor = undefined;
      this._initializeVt(cols, rows);
      if (init !== undefined && init !== "") {
        this._doFeed(init);
      }
      this._dispatchEvent("reset", {
        cols,
        rows,
        theme
      });
    }
    _resizeVt(cols, rows) {
      if (cols === this.vt.cols && rows === this.vt.rows) return;
      const affectedLines = this.vt.resize(cols, rows);
      affectedLines.forEach(i => this.changedLines.add(i));
      this.cursor = undefined;
      this.vt.cols = cols;
      this.vt.rows = rows;
      this.logger.debug(`core: vt resize (${cols}x${rows})`);
      this._dispatchEvent("resize", {
        cols,
        rows
      });
    }
    _initializeVt(cols, rows) {
      this.logger.debug(`core: vt init (${cols}x${rows})`);
      this.vt = this.wasm.create(cols, rows, true, 100);
      this.vt.cols = cols;
      this.vt.rows = rows;
      this.changedLines.clear();
      for (let i = 0; i < rows; i++) {
        this.changedLines.add(i);
      }
    }
    _parsePoster(poster) {
      if (typeof poster !== "string") return {};
      if (poster.substring(0, 16) == "data:text/plain,") {
        return {
          type: "text",
          value: [poster.substring(16)]
        };
      } else if (poster.substring(0, 4) == "npt:") {
        return {
          type: "npt",
          value: parseNpt(poster.substring(4))
        };
      }
      return {};
    }
    _renderPoster(poster) {
      const cols = this.cols ?? 80;
      const rows = this.rows ?? 24;
      this.logger.debug(`core: poster init (${cols}x${rows})`);
      const vt = this.wasm.create(cols, rows, false, 0);
      poster.forEach(text => vt.feed(text));
      const cursor = vt.getCursor() ?? false;
      const lines = [];
      for (let i = 0; i < rows; i++) {
        lines.push({
          id: i,
          segments: vt.getLine(i)
        });
      }
      return {
        cursor,
        lines
      };
    }
    _normalizeMarkers(markers) {
      if (Array.isArray(markers)) {
        return markers.map(m => typeof m === "number" ? [m, ""] : m);
      }
    }
  }
  const DRIVERS = new Map([["benchmark", benchmark], ["clock", clock], ["eventsource", eventsource], ["random", random], ["recording", recording], ["websocket", websocket]]);
  const PARSERS = new Map([["asciicast", parse$2], ["typescript", parse$1], ["ttyrec", parse]]);
  function getDriver(src) {
    if (typeof src === "function") return src;
    if (typeof src === "string") {
      if (src.substring(0, 5) == "ws://" || src.substring(0, 6) == "wss://") {
        src = {
          driver: "websocket",
          url: src
        };
      } else if (src.substring(0, 6) == "clock:") {
        src = {
          driver: "clock"
        };
      } else if (src.substring(0, 7) == "random:") {
        src = {
          driver: "random"
        };
      } else if (src.substring(0, 10) == "benchmark:") {
        src = {
          driver: "benchmark",
          url: src.substring(10)
        };
      } else {
        src = {
          driver: "recording",
          url: src
        };
      }
    }
    if (src.driver === undefined) {
      src.driver = "recording";
    }
    if (src.driver == "recording") {
      if (src.parser === undefined) {
        src.parser = "asciicast";
      }
      if (typeof src.parser === "string") {
        if (PARSERS.has(src.parser)) {
          src.parser = PARSERS.get(src.parser);
        } else {
          throw `unknown parser: ${src.parser}`;
        }
      }
    }
    if (DRIVERS.has(src.driver)) {
      const driver = DRIVERS.get(src.driver);
      return (callbacks, opts) => driver(src, callbacks, opts);
    } else {
      throw `unsupported driver: ${JSON.stringify(src)}`;
    }
  }

  let logger = new DummyLogger();
  let core;
  onmessage = async function (e) {
    const promise = invoke(e.data.method, e.data.params);
    if (e.data.id !== undefined) {
      const result = await promise;
      postMessage({
        result,
        id: e.data.id
      });
    }
  };
  function invoke(method, params) {
    switch (method) {
      case "getChanges":
        return core.getChanges();
      case "new":
        const opts = params[1];
        if (opts.logger === true) {
          logger = console;
        }
        opts.logger = logger;
        core = new Core(params[0], opts);
        return;
      case "init":
        return core.init();
      case "play":
        return core.play();
      case "pause":
        return core.pause();
      case "togglePlay":
        return core.togglePlay();
      case "stop":
        return core.stop();
      case "seek":
        return core.seek(params);
      case "step":
        return core.step(params);
      case "getCurrentTime":
        return core.getCurrentTime();
      case "getRemainingTime":
        return core.getRemainingTime();
      case "getProgress":
        return core.getProgress();
      case "addEventListener":
        core.addEventListener(params[0], e => {
          postMessage({
            method: "onEvent",
            params: {
              name: params[0],
              event: e
            }
          });
        });
        return;
      default:
        throw `invalid method ${method}`;
    }
  }

})();
