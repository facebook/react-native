
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const ReactNativeViewConfigRegistry = require('../../Renderer/shims/ReactNativeViewConfigRegistry');
const ReactNativeViewViewConfig = require('../View/ReactNativeViewViewConfig');
const verifyComponentAttributeEquivalence = require('../../Utilities/verifyComponentAttributeEquivalence');

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
    color: { process: require('../../StyleSheet/processColor') },
    size: true,
  },
};

verifyComponentAttributeEquivalence('RCTActivityIndicatorView', ActivityIndicatorViewViewConfig);

ReactNativeViewConfigRegistry.register(
  'RCTActivityIndicatorView',
  () => ActivityIndicatorViewViewConfig,
);

module.exports = 'RCTActivityIndicatorView'; // RCT prefix present for paper support
