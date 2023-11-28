/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

const invariant = require('invariant');
function createAliasResolver(aliasMap) {
  return aliasName => {
    const alias = aliasMap[aliasName];
    invariant(alias != null, `Unable to resolve type alias '${aliasName}'.`);
    return alias;
  };
}
function getModules(schema) {
  return Object.keys(schema.modules).reduce((modules, hasteModuleName) => {
    const module = schema.modules[hasteModuleName];
    if (module == null || module.type === 'Component') {
      return modules;
    }
    modules[hasteModuleName] = module;
    return modules;
  }, {});
}
function getAreEnumMembersInteger(members) {
  return !members.some(m => `${m.value}`.includes('.'));
}
module.exports = {
  createAliasResolver,
  getModules,
  getAreEnumMembersInteger,
};
