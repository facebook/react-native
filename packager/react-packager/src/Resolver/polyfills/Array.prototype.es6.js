/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @provides Array.prototype.es6
 * @polyfill
 */

/* eslint-disable */

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
function findIndex(predicate, context) {
  if (this == null) {
    throw new TypeError(
      'Array.prototype.findIndex called on null or undefined'
    );
  }
  if (typeof predicate !== 'function') {
    throw new TypeError('predicate must be a function');
  }
  var list = Object(this);
  var length = list.length >>> 0;
  for (var i = 0; i < length; i++) {
    if (predicate.call(context, list[i], i, list)) {
      return i;
    }
  }
  return -1;
}

if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: findIndex
  });
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: function(predicate, context) {
      if (this == null) {
        throw new TypeError(
          'Array.prototype.find called on null or undefined'
        );
      }
      var index = findIndex.call(this, predicate, context);
      return index === -1 ? undefined : this[index];
    }
  });
}
