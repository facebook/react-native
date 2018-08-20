/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

var Assert = require('NativeModules').Assert;

var Asserts = {
  assertEquals: function(expected, actual, msg) {
    if (expected !== actual) {
      Assert.fail(
        msg ||
          'Expected: ' +
            expected +
            ', received: ' +
            actual +
            '\n' +
            'at ' +
            new Error().stack,
      );
    } else {
      Assert.success();
    }
  },
  assertTrue: function(expr, msg) {
    Asserts.assertEquals(true, expr, msg);
  },
};

module.exports = Asserts;
