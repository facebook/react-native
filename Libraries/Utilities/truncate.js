/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule truncate
 * @flow
 */
'use strict';

var merge = require('merge');

type truncateOptions = {
  breakOnWords: boolean;
  minDelta: number;
  elipsis: string;
}

var defaultOptions = {
  breakOnWords: true,
  minDelta: 10, // Prevents truncating a tiny bit off the end
  elipsis: '...',
};

// maxChars (including ellipsis)
var truncate = function(
  str: ?string,
  maxChars: number,
  options: truncateOptions
): ?string {
  options = merge(defaultOptions, options);
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
