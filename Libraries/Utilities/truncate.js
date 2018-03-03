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
  options?: truncateOptions
): ?string {
  options = Object.assign({}, defaultOptions, options);
  if (str && str.length &&
      str.length - options.minDelta + options.elipsis.length >= maxChars) {
    str = str.slice(0, maxChars - options.elipsis.length + 1);
    if (options.breakOnWords) {
      var ii = Math.max(str.lastIndexOf(' '), str.lastIndexOf('\n'));
      str = str.slice(0, ii);
    }
    str = str.trim() + options.elipsis;
  }
  return str;
};

module.exports = truncate;
