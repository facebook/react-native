/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

const objectTypeForPrimitiveType = {
  boolean: 'Boolean',
  double: 'Double',
  float: 'Float',
  int: 'Integer',
};

function wrapOptional(type: string, isRequired: boolean): string {
  return isRequired
    ? type
    : `@Nullable ${objectTypeForPrimitiveType[type] ?? type}`;
}

module.exports = {
  wrapOptional,
};
