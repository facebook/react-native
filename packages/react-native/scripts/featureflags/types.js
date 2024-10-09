/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type FeatureFlagValue = boolean | number | string;

export type FeatureFlagDefinitions = {
  common: FeatureFlagList,
  jsOnly: FeatureFlagList,
};

type FeatureFlagList = {
  [flagName: string]: {
    description: string,
    defaultValue: FeatureFlagValue,
  },
};

export type GeneratorConfig = {
  featureFlagDefinitions: FeatureFlagDefinitions,
  jsPath: string,
  commonCxxPath: string,
  commonNativeModuleCxxPath: string,
  androidPath: string,
  androidJniPath: string,
};

export type GeneratorOptions = {
  verifyUnchanged: boolean,
};

export type GeneratorResult = {
  [path: string]: string /* content */,
};
