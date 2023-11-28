/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 * @oncall react_native
 */

'use strict';

function _toArray(arr) {
  return (
    _arrayWithHoles(arr) ||
    _iterableToArray(arr) ||
    _unsupportedIterableToArray(arr) ||
    _nonIterableRest()
  );
}
function _nonIterableRest() {
  throw new TypeError(
    'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
  );
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === 'Object' && o.constructor) n = o.constructor.name;
  if (n === 'Map' || n === 'Set') return Array.from(o);
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _iterableToArray(iter) {
  if (
    (typeof Symbol !== 'undefined' && iter[Symbol.iterator] != null) ||
    iter['@@iterator'] != null
  )
    return Array.from(iter);
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
const path = require('path');
function parseArgs(args) {
  if (args.length > 2 && ['-p', '--platform'].indexOf(args[2]) >= 0) {
    const _args$slice = args.slice(4),
      _args$slice2 = _toArray(_args$slice),
      outfile = _args$slice2[0],
      fileList = _args$slice2.slice(1);
    return {
      platform: args[3],
      outfile,
      fileList,
    };
  }
  const _args$slice3 = args.slice(2),
    _args$slice4 = _toArray(_args$slice3),
    outfile = _args$slice4[0],
    fileList = _args$slice4.slice(1);
  return {
    platform: null,
    outfile,
    fileList,
  };
}

/**
 * This function is used by the CLI to decide whether a JS/TS file has to be processed or not by the Codegen.
 * Parameters:
 *   - file: the path to the file
 *   - currentPlatform: the current platform for which we are creating the specs
 * Returns: `true` if the file can be used to generate some code; `false` otherwise
 *
 */
function filterJSFile(file, currentPlatform) {
  const isSpecFile = /^(Native.+|.+NativeComponent)/.test(path.basename(file));
  const isNotNativeUIManager = !file.endsWith('NativeUIManager.js');
  const isNotNativeSampleTurboModule = !file.endsWith(
    'NativeSampleTurboModule.js',
  );
  const isNotTest = !file.includes('__tests');
  const isNotTSTypeDefinition = !file.endsWith('.d.ts');
  const isValidCandidate =
    isSpecFile &&
    isNotNativeUIManager &&
    isNotNativeSampleTurboModule &&
    isNotTest &&
    isNotTSTypeDefinition;
  const filenameComponents = path.basename(file).split('.');
  const isPlatformAgnostic = filenameComponents.length === 2;
  if (currentPlatform == null) {
    // need to accept only files that are platform agnostic
    return isValidCandidate && isPlatformAgnostic;
  }

  // If a platform is passed, accept both platform agnostic specs...
  if (isPlatformAgnostic) {
    return isValidCandidate;
  }

  // ...and specs that share the same platform as the one passed.
  // specfiles must follow the pattern: <filename>[.<platform>].(js|ts|tsx)
  const filePlatform =
    filenameComponents.length > 2 ? filenameComponents[1] : 'unknown';
  return isValidCandidate && currentPlatform === filePlatform;
}
module.exports = {
  parseArgs,
  filterJSFile,
};
