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

function getSafePropertyName(property) {
  if (property.name === 'id') {
    return `${property.name}_`;
  }
  return property.name;
}
function getNamespacedStructName(hasteModuleName, structName) {
  return `JS::${hasteModuleName}::${structName}`;
}
module.exports = {
  getSafePropertyName,
  getNamespacedStructName,
};
