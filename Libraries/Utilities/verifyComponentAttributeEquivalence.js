/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const deepDiffer = require('deepDiffer');
const getNativeComponentAttributes = require('getNativeComponentAttributes');

import type {ReactNativeBaseComponentViewConfig} from 'ReactNativeTypes';

function verifyComponentAttributeEquivalence(
  componentName: string,
  config: ReactNativeBaseComponentViewConfig<>,
) {
  if (deepDiffer(getNativeComponentAttributes(componentName), config)) {
    console.error(
      `${componentName} config in JS does not match config specified by Native`,
    );
  }
}

module.exports = verifyComponentAttributeEquivalence;
