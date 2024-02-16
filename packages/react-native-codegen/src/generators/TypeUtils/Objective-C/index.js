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

function wrapOptional(type: string, isRequired: boolean): string {
  return isRequired ? type : `${type} _Nullable`;
}

module.exports = {
  wrapOptional,
};
