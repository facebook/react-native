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

/**
 * The purpose of this function is to validate that the view config that
 * native exposes for a given view manager is the same as the view config
 * that is specified for that view manager in JS.
 *
 * In order to improve perf, we want to avoid calling into native to get
 * the view config when each view manager is used. To do this, we are moving
 * the configs to JS. In the future we will use these JS based view configs
 * to codegen the view manager on native to ensure they stay in sync without
 * this runtime check.
 *
 * If this function fails, that likely means a change was made to the native
 * view manager without updating the JS config as well. Ideally you can make
 * that direct change to the JS config. If you don't know what the differences
 * are, the best approach I've found is to create a view that prints
 * the return value of getNativeComponentAttributes, and then copying that
 * text and pasting it back into JS:
 * <Text selectable={true}>{JSON.stringify(getNativeComponentAttributes('RCTView'))}</Text>
 *
 * This is meant to be a stopgap until the time comes when we only have a
 * single source of truth. I wonder if this message will still be here two
 * years from now...
 */
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
