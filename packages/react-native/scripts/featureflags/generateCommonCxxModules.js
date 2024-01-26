/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const ReactNativeFeatureFlagsCPP = require('./templates/common-cxx/ReactNativeFeatureFlags.cpp-template');
const ReactNativeFeatureFlagsH = require('./templates/common-cxx/ReactNativeFeatureFlags.h-template');
const ReactNativeFeatureFlagsAccessorCPP = require('./templates/common-cxx/ReactNativeFeatureFlagsAccessor.cpp-template');
const ReactNativeFeatureFlagsAccessorH = require('./templates/common-cxx/ReactNativeFeatureFlagsAccessor.h-template');
const ReactNativeFeatureFlagsDefaultsH = require('./templates/common-cxx/ReactNativeFeatureFlagsDefaults.h-template');
const ReactNativeFeatureFlagsProviderH = require('./templates/common-cxx/ReactNativeFeatureFlagsProvider.h-template');
const path = require('path');

module.exports = function generateCommonCxxModules(
  generatorConfig,
  featureFlagsConfig,
) {
  return {
    [path.join(generatorConfig.commonCxxPath, 'ReactNativeFeatureFlags.h')]:
      ReactNativeFeatureFlagsH(featureFlagsConfig),
    [path.join(generatorConfig.commonCxxPath, 'ReactNativeFeatureFlags.cpp')]:
      ReactNativeFeatureFlagsCPP(featureFlagsConfig),
    [path.join(
      generatorConfig.commonCxxPath,
      'ReactNativeFeatureFlagsAccessor.h',
    )]: ReactNativeFeatureFlagsAccessorH(featureFlagsConfig),
    [path.join(
      generatorConfig.commonCxxPath,
      'ReactNativeFeatureFlagsAccessor.cpp',
    )]: ReactNativeFeatureFlagsAccessorCPP(featureFlagsConfig),
    [path.join(
      generatorConfig.commonCxxPath,
      'ReactNativeFeatureFlagsDefaults.h',
    )]: ReactNativeFeatureFlagsDefaultsH(featureFlagsConfig),
    [path.join(
      generatorConfig.commonCxxPath,
      'ReactNativeFeatureFlagsProvider.h',
    )]: ReactNativeFeatureFlagsProviderH(featureFlagsConfig),
  };
};
