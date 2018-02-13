/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const toCamelCase = require('lodash').camelCase;

module.exports = function applyParams(str, params, prefix) {
  return str.replace(
    /\$\{(\w+)\}/g,
    (pattern, param) => {
      const name = toCamelCase(prefix) + '_' + param;

      return params[param]
        ? `getResources().getString(R.string.${name})`
        : null;
    }
  );
};
