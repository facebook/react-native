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

const {upperCaseFirst} = require('../Helpers.js');

// import type {EventTypeShape} from './CodegenSchema';

function generateStructName(
  componentName: string,
  parts: $ReadOnlyArray<string> = [],
) {
  const additional = parts.map(upperCaseFirst).join('');
  return `${componentName}${additional}Struct`;
}

module.exports = {
  generateStructName,
};
