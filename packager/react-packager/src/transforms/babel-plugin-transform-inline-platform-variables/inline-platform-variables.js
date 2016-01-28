/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const t = require('babel-types');

module.exports = function () {
  return {
    visitor: {
      ReferencedIdentifier(path) {
        let platform = this.opts.platform;
        let name = path.node.name;
        let is = false;

        if (name === "__ANDROID") {
          is = platform === "android";
        } else if (name === "__IOS") {
          is = platform === "ios";
        } else {
          return;
        }

        path.replaceWith(t.booleanLiteral(is));
      }
    }
  };
};
