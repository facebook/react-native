/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const JReactNativeFeatureFlagsCxxInteropCPP = require('./templates/android/JReactNativeFeatureFlagsCxxInterop.cpp-template');
const JReactNativeFeatureFlagsCxxInteropH = require('./templates/android/JReactNativeFeatureFlagsCxxInterop.h-template');
const ReactNativeFeatureFlagsKt = require('./templates/android/ReactNativeFeatureFlags.kt-template');
const ReactNativeFeatureFlagsCxxAccessorKt = require('./templates/android/ReactNativeFeatureFlagsCxxAccessor.kt-template');
const ReactNativeFeatureFlagsCxxInteropKt = require('./templates/android/ReactNativeFeatureFlagsCxxInterop.kt-template');
const ReactNativeFeatureFlagsDefaultsKt = require('./templates/android/ReactNativeFeatureFlagsDefaults.kt-template');
const ReactNativeFeatureFlagsLocalAccessorKt = require('./templates/android/ReactNativeFeatureFlagsLocalAccessor.kt-template');
const ReactNativeFeatureFlagsProviderKt = require('./templates/android/ReactNativeFeatureFlagsProvider.kt-template');
const ReactNativeFeatureFlagsProviderHolderCPP = require('./templates/android/ReactNativeFeatureFlagsProviderHolder.cpp-template');
const ReactNativeFeatureFlagsProviderHolderH = require('./templates/android/ReactNativeFeatureFlagsProviderHolder.h-template');
const path = require('path');

module.exports = function generateandroidModules(
  generatorConfig,
  featureFlagsConfig,
) {
  return {
    [path.join(generatorConfig.androidPath, 'ReactNativeFeatureFlags.kt')]:
      ReactNativeFeatureFlagsKt(featureFlagsConfig),
    [path.join(
      generatorConfig.androidPath,
      'ReactNativeFeatureFlagsCxxAccessor.kt',
    )]: ReactNativeFeatureFlagsCxxAccessorKt(featureFlagsConfig),
    [path.join(
      generatorConfig.androidPath,
      'ReactNativeFeatureFlagsLocalAccessor.kt',
    )]: ReactNativeFeatureFlagsLocalAccessorKt(featureFlagsConfig),
    [path.join(
      generatorConfig.androidPath,
      'ReactNativeFeatureFlagsCxxInterop.kt',
    )]: ReactNativeFeatureFlagsCxxInteropKt(featureFlagsConfig),
    [path.join(
      generatorConfig.androidPath,
      'ReactNativeFeatureFlagsDefaults.kt',
    )]: ReactNativeFeatureFlagsDefaultsKt(featureFlagsConfig),
    [path.join(
      generatorConfig.androidPath,
      'ReactNativeFeatureFlagsProvider.kt',
    )]: ReactNativeFeatureFlagsProviderKt(featureFlagsConfig),
    [path.join(
      generatorConfig.androidJniPath,
      'ReactNativeFeatureFlagsProviderHolder.h',
    )]: ReactNativeFeatureFlagsProviderHolderH(featureFlagsConfig),
    [path.join(
      generatorConfig.androidJniPath,
      'ReactNativeFeatureFlagsProviderHolder.cpp',
    )]: ReactNativeFeatureFlagsProviderHolderCPP(featureFlagsConfig),
    [path.join(
      generatorConfig.androidJniPath,
      'JReactNativeFeatureFlagsCxxInterop.h',
    )]: JReactNativeFeatureFlagsCxxInteropH(featureFlagsConfig),
    [path.join(
      generatorConfig.androidJniPath,
      'JReactNativeFeatureFlagsCxxInterop.cpp',
    )]: JReactNativeFeatureFlagsCxxInteropCPP(featureFlagsConfig),
  };
};
