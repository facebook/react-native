/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {StructProperty} from './StructCollector';

function getSafePropertyName(property: StructProperty): string {
  if (property.name === 'id') {
    return `${property.name}_`;
  }
  return property.name;
}

function getNamespacedStructName(
  hasteModuleName: string,
  structName: string,
): string {
  return `JS::${hasteModuleName}::${structName}`;
}

module.exports = {
  getSafePropertyName,
  getNamespacedStructName,
};
