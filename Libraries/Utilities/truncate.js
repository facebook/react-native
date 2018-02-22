/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule truncate
 * @flow
 */
'use strict';

type truncateOptions = {
  breakOnWords: boolean,
  minDelta: number,
  elipsis: string,
}

const defaultOptions = {
  breakOnWords: true,
  minDelta: 10, // Prevents truncating a tiny bit off the end
  elipsis: '...',
};

// maxChars (including ellipsis)
const truncate = function(
  str: ?string,
  maxChars: number,
  options: truncateOptions
): ?string {
  let opts =  Object.assign({}, defaultOptions, options);
  let strArg = str;
  if (strArg && strArg.length &&
      strArg.length - opts.minDelta + opts.elipsis.length >= maxChars) {
    strArg = strArg.slice(0, maxChars - opts.elipsis.length + 1);
    if (opts.breakOnWords) {
      var ii = Math.max(strArg.lastIndexOf(' '), strArg.lastIndexOf('\n'));
      strArg = strArg.slice(0, ii);
    }
    strArg = strArg.trim() + opts.elipsis;
  }
  return strArg;
};

module.exports = truncate;
