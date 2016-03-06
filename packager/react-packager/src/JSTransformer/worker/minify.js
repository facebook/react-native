/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const uglify = require('uglify-js');

const MAGIC_MARKER = '\u0002\ueffe\ue277\uead5';
const MAGIC_MARKER_SPLITTER =
  /(?:\x02|\\u0002|\\x02)(?:\ueffe|\\ueffe)(?:\ue277|\\ue277)(?:\uead5|\\uead5)/;

// IIFE = "immediately invoked function expression"
// we wrap modules in functions to allow the minifier to mangle local variables
function wrapCodeInIIFE(code, moduleLocals) {
  return `(function(${moduleLocals.join(',')}){${code}}());`;
}

function extractCodeFromIIFE(code) {
  return code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));
}

function extractModuleLocalsFromIIFE(code) {
  return code.substring(code.indexOf('(', 1) + 1, code.indexOf(')')).split(',');
}

function splitFirstElementAt(array, offset) {
  const first = array.shift();
  array.unshift(first.slice(0, offset + 1), first.slice(offset + 1));
  return array;
}

function insertMarkers(code, dependencyOffsets) {
  return dependencyOffsets
    .reduceRight(splitFirstElementAt, [code])
    .join(MAGIC_MARKER);
}

function extractMarkers(codeWithMarkers) {
  const dependencyOffsets = [];
  const codeBits = codeWithMarkers.split(MAGIC_MARKER_SPLITTER);
  var offset = 0;
  for (var i = 0, max = codeBits.length - 1; i < max; i++) {
    offset += codeBits[i].length;
    dependencyOffsets.push(offset - 1);
  }

  return {code: codeBits.join(''), dependencyOffsets};
}

function minify(filename, code, map, dependencyOffsets, moduleLocals) {
  // before minifying, code is wrapped in an immediately invoked function
  // expression, so that top level variables can be shortened safely
  code = wrapCodeInIIFE(
    // since we don't know where the strings specifying dependencies will be
    // located in the minified code, we mark them with a special marker string
    // and extract them afterwards.
    // That way, post-processing code can use these positions
    insertMarkers(code, dependencyOffsets),
    moduleLocals
  );

  const minifyResult = uglify.minify(code, {
    fromString: true,
    inSourceMap: map,
    outSourceMap: filename,
    output: {
      ascii_only: true,
      screw_ie8: true,
    },
  });

  const minifiedModuleLocals = extractModuleLocalsFromIIFE(minifyResult.code);
  const codeWithMarkers = extractCodeFromIIFE(minifyResult.code);
  const result = extractMarkers(codeWithMarkers);
  result.map = minifyResult.map;
  result.moduleLocals = {};
  moduleLocals.forEach(
    (key, i) => result.moduleLocals[key] = minifiedModuleLocals[i]);

  return result;
}

module.exports = minify;
