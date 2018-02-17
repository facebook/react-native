/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const applyParams = require('./applyParams');

module.exports = function makePackagePatch(packageInstance, params, prefix) {
  const processedInstance = applyParams(packageInstance, params, prefix);

  return {
    pattern: 'new MainReactPackage()',
    patch: ',\n            ' + processedInstance,
  };
};
