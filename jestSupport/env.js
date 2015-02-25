'use strict';

global.setImmediate = global.setImmediate || function(fn) {
  return setTimeout(fn, 0);
};
