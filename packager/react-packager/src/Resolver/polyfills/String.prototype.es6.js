/**
 * @provides String.prototype.es6
 * @polyfill
 */

/*eslint global-strict:0, no-extend-native:0, no-bitwise:0 */
/*jshint bitwise:false*/

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

if (!String.prototype.contains) {
  String.prototype.contains = function(search) {
    'use strict';
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var pos = arguments.length > 1 ?
      (Number(arguments[1]) || 0) : 0;
    return string.indexOf(String(search), pos) !== -1;
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
