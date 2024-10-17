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
  common: CommonFeatureFlagList,
  jsOnly: JsOnlyFeatureFlagList,
};

type CommonFeatureFlagList = {
  [flagName: string]: {
    defaultValue: FeatureFlagValue,
    metadata: FeatureFlagMetadata,
    // Indicates if this API should only be defined in JavaScript, only to
    // preserve backwards compatibility with existing native code temporarily.
    skipNativeAPI?: true,
  },
};

type JsOnlyFeatureFlagList = {
  [flagName: string]: {
    defaultValue: FeatureFlagValue,
    metadata: FeatureFlagMetadata,
  },
};

type FeatureFlagMetadata =
  | {
      purpose: 'experimentation',
      /**
       * Aproximate date when the flag was added.
       * Used to help prioritize feature flags that need to be cleaned up.
       */
      dateAdded: string,
      description: string,
    }
  | {
      purpose: 'operational' | 'release',
      description: string,
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
