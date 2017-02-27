/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @polyfill
 */

/* eslint-disable strict, no-extend-native, no-bitwise */

/*
 * NOTE: We use (Number(x) || 0) to replace NaN values with zero.
 */

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(search) {
    'use strict';
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var pos = arguments.length > 1 ?
      (Number(arguments[1]) || 0) : 0;
    var start = Math.min(Math.max(pos, 0), string.length);
    return string.indexOf(String(search), pos) === start;
  };
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(search) {
    'use strict';
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var stringLength = string.length;
    var searchString = String(search);
    var pos = arguments.length > 1 ?
      (Number(arguments[1]) || 0) : stringLength;
    var end = Math.min(Math.max(pos, 0), stringLength);
    var start = end - searchString.length;
    if (start < 0) {
      return false;
    }
    return string.lastIndexOf(searchString, start) === start;
  };
}

if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    'use strict';
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    count = Number(count) || 0;
    if (count < 0 || count === Infinity) {
      throw RangeError();
    }
    if (count === 1) {
      return string;
    }
    var result = '';
    while (count) {
      if (count & 1) {
        result += string;
      }
      if ((count >>= 1)) {
        string += string;
      }
    }
    return result;
  };
}

if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}
