/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const NativeReactNativeFeatureFlagsCPP = require('./templates/js/NativeReactNativeFeatureFlags.cpp-template');
const NativeReactNativeFeatureFlagsH = require('./templates/js/NativeReactNativeFeatureFlags.h-template');
const NativeReactNativeFeatureFlagsJS = require('./templates/js/NativeReactNativeFeatureFlags.js-template');
const ReactNativeFeatureFlagsJS = require('./templates/js/ReactNativeFeatureFlags.js-template');
const path = require('path');

module.exports = function generateCommonCxxModules(
  generatorConfig,
  featureFlagsConfig,
) {
  return {
    [path.join(generatorConfig.jsPath, 'ReactNativeFeatureFlags.js')]:
      ReactNativeFeatureFlagsJS(featureFlagsConfig),
    [path.join(generatorConfig.jsPath, 'NativeReactNativeFeatureFlags.js')]:
      NativeReactNativeFeatureFlagsJS(featureFlagsConfig),
    [path.join(
      generatorConfig.commonNativeModuleCxxPath,
      'NativeReactNativeFeatureFlags.h',
    )]: NativeReactNativeFeatureFlagsH(featureFlagsConfig),
    [path.join(
      generatorConfig.commonNativeModuleCxxPath,
      'NativeReactNativeFeatureFlags.cpp',
    )]: NativeReactNativeFeatureFlagsCPP(featureFlagsConfig),
  };
};
