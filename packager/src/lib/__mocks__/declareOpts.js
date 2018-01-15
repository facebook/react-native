/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

module.exports = function(declared) {
  return function(opts) {
    for (var p in declared) {
      if (opts[p] == null && declared[p].default != null) {
        opts[p] = declared[p].default;
      }
    }
    return opts;
  };
};
