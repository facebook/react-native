/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule truncate
 */
'use strict';

var merge = require('merge');

var defaultOptions = {
  breakOnWords: true,
  minDelta: 10, // Prevents truncating a tiny bit off the end
  elipsis: '...',
};

// maxChars (including elipsis)
var truncate = function(str, maxChars, options) {
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

