/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule String.prototype.es6
 * @polyfill
 * @nolint
 */

/* eslint-disable no-extend-native, no-bitwise */

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

if (!String.prototype.codePointAt) {
  String.prototype.codePointAt = function(position) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var size = string.length;
    // `ToInteger`
    var index = position ? Number(position) : 0;
    if (Number.isNaN(index)) {
      index = 0;
    }
    // Account for out-of-bounds indices:
    if (index < 0 || index >= size) {
      return undefined;
    }
    // Get the first code unit
    var first = string.charCodeAt(index);
    var second;
    if (
      // check if it’s the start of a surrogate pair
      first >= 0xd800 &&
      first <= 0xdbff && // high surrogate
      size > index + 1 // there is a next code unit
    ) {
      second = string.charCodeAt(index + 1);
      if (second >= 0xdc00 && second <= 0xdfff) {
        // low surrogate
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        return (first - 0xd800) * 0x400 + second - 0xdc00 + 0x10000;
      }
    }
    return first;
  };
}
