/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const toCamelCase = require('lodash').camelCase;

module.exports = function applyParams(str, params, prefix) {
  return str.replace(/\$\{(\w+)\}/g, (pattern, param) => {
    const name = toCamelCase(prefix) + '_' + param;

    return params[param] ? `getResources().getString(R.string.${name})` : null;
  });
};
