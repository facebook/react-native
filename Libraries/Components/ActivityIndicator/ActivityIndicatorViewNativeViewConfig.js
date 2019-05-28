
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');
const ReactNativeViewViewConfig = require('ReactNativeViewViewConfig');
const verifyComponentAttributeEquivalence = require('verifyComponentAttributeEquivalence');

const ActivityIndicatorViewViewConfig = {
  uiViewClassName: 'RCTActivityIndicatorView',
  Commands: {},

  bubblingEventTypes: {
    ...ReactNativeViewViewConfig.bubblingEventTypes,
  },

  directEventTypes: {
    ...ReactNativeViewViewConfig.directEventTypes,
  },

  validAttributes: {
    ...ReactNativeViewViewConfig.validAttributes,
    hidesWhenStopped: true,
    animating: true,
    color: { process: require('processColor') },
    size: true,
  },
};

verifyComponentAttributeEquivalence('RCTActivityIndicatorView', ActivityIndicatorViewViewConfig);

ReactNativeViewConfigRegistry.register(
  'RCTActivityIndicatorView',
  () => ActivityIndicatorViewViewConfig,
);

module.exports = 'RCTActivityIndicatorView'; // RCT prefix present for paper support
