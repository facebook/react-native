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

export type FeatureFlagDefinitions = $ReadOnly<{
  common: CommonFeatureFlagList,
  jsOnly: JsOnlyFeatureFlagList,
}>;

export type CommonFeatureFlagList = $ReadOnly<{
  [flagName: string]: $ReadOnly<{
    defaultValue: FeatureFlagValue,
    metadata: FeatureFlagMetadata,
    // Indicates if this API should only be defined in JavaScript, only to
    // preserve backwards compatibility with existing native code temporarily.
    skipNativeAPI?: true,
  }>,
}>;

export type JsOnlyFeatureFlagList = $ReadOnly<{
  [flagName: string]: $ReadOnly<{
    defaultValue: FeatureFlagValue,
    metadata: FeatureFlagMetadata,
  }>,
}>;

export type FeatureFlagMetadata =
  | $ReadOnly<{
      purpose: 'experimentation',
      /**
       * Aproximate date when the flag was added.
       * Used to help prioritize feature flags that need to be cleaned up.
       */
      dateAdded: string,
      description: string,
    }>
  | $ReadOnly<{
      purpose: 'operational' | 'release',
      description: string,
    }>;

export type GeneratorConfig = $ReadOnly<{
  featureFlagDefinitions: FeatureFlagDefinitions,
  jsPath: string,
  commonCxxPath: string,
  commonNativeModuleCxxPath: string,
  androidPath: string,
  androidJniPath: string,
}>;

export type GeneratorOptions = $ReadOnly<{
  verifyUnchanged: boolean,
}>;

export type GeneratorResult = $ReadOnly<{
  [path: string]: string /* content */,
}>;
