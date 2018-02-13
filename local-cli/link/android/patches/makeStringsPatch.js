/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const toCamelCase = require('lodash').camelCase;

module.exports = function makeStringsPatch(params, prefix) {
  const values = Object.keys(params)
    .map(param => {
      const name = toCamelCase(prefix) + '_' + param;
      return '    ' +
        `<string moduleConfig="true" name="${name}">${params[param]}</string>`;
    });

  const patch = values.length > 0
    ? values.join('\n') + '\n'
    : '';

  return {
    pattern: '<resources>\n',
    patch,
  };
};
