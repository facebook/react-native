/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const SINGLE_QUOTE = "'".charCodeAt(0);
const DOUBLE_QUOTE = '"'.charCodeAt(0);
const BACKSLASH = '\\'.charCodeAt(0);
const SLASH = '/'.charCodeAt(0);
const NEWLINE = '\n'.charCodeAt(0);
const ASTERISK = '*'.charCodeAt(0);

// dollar is the only regex special character valid in identifiers
const escapeRegExp = identifier => identifier.replace(/[$]/g, '\\$');

function binarySearch(indexes, index) {
  var low = 0;
  var high = indexes.length - 1;
  var i = 0;

  if (indexes[low] === index) {
    return low;
  }
  while (high - low > 1) {
    var current = low + ((high - low) >>> 1); // right shift divides by 2 and floors
    if (index === indexes[current]) {
      return current;
    }
    if (index > indexes[current]) {
      low = current;
    } else {
      high = current;
    }
  }
  return low;
}

function indexOfCharCode(string, needle, i) {
  for (var charCode; (charCode = string.charCodeAt(i)); i++) {
    if (charCode === needle) {
      return i;
    }
  }
  return -1;
}

const reRequire = /(?:^|[^.\s])\s*\brequire\s*\(\s*(['"])(.*?)\1/g;

/**
 * Extracts dependencies (module IDs imported with the `require` function) from
 * a string containing code.
 * The function is regular expression based for speed reasons.
 *
 * The code is traversed twice:
 *  1. An array of ranges is built, where indexes 0-1, 2-3, 4-5, etc. are code,
 *     and indexes 1-2, 3-4, 5-6, etc. are string literals and comments.
 *  2. require calls are extracted with a regular expression.
 *
 * The result of the dependency extraction is an de-duplicated array of
 * dependencies, and an array of offsets to the string literals with module IDs.
 * The index points to the opening quote.
 */
function extractDependencies(code) {
  const ranges = [0];
  // are we currently in a quoted string? -> SINGLE_QUOTE or DOUBLE_QUOTE, else undefined
  var currentQuote;
  // scan the code for string literals and comments.
  for (var i = 0, charCode; (charCode = code.charCodeAt(i)); i++) {
    if (charCode === BACKSLASH) {
      i += 1;
      continue;
    }

    if (charCode === SLASH && currentQuote === undefined) {
      var next = code.charCodeAt(i + 1);
      var end = undefined;
      if (next === SLASH) {
        end = indexOfCharCode(code, NEWLINE, i + 2);
      } else if (next === ASTERISK) {
        end = code.indexOf('*/', i + 2) + 1; // assume valid JS input here
      }
      if (end === -1) {
        // if the comment does not end, it goes to the end of the file
        end += code.length;
      }
      if (end !== undefined) {
        ranges.push(i, end);
        i = end;
        continue;
      }
    }

    var isQuoteStart = currentQuote === undefined &&
                       (charCode === SINGLE_QUOTE || charCode === DOUBLE_QUOTE);
    if (isQuoteStart || currentQuote === charCode) {
      ranges.push(i);
      currentQuote = currentQuote === charCode ? undefined : charCode;
    }
  }
  ranges.push(i);

  // extract dependencies
  const dependencies = new Set();
  const dependencyOffsets = [];
  for (var match; (match = reRequire.exec(code)); ) {
    // check whether the match is in a code range, and not inside of a string
    // literal or a comment
    if (binarySearch(ranges, match.index) % 2 === 0) {
      dependencies.add(match[2]);
      dependencyOffsets.push(
        match[0].length - match[2].length - 2 + match.index);
    }
  }

  return {
    dependencyOffsets,
    dependencies: Array.from(dependencies.values()),
  };
}

module.exports = extractDependencies;
