'use strict';

module.exports = function(declared) {
  return function(opts) {
    for (var p in declared) {
      if (opts[p] == null && declared[p].default != null){
        opts[p] = declared[p].default;
      }
    }
    return opts;
  };
};
