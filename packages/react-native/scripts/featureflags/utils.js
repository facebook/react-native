/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {FeatureFlagValue} from './types';

export function getCxxTypeFromDefaultValue(
  defaultValue: FeatureFlagValue,
): string {
  switch (typeof defaultValue) {
    case 'boolean':
      return 'bool';
    case 'number':
      return 'int';
    case 'string':
      return 'std::string';
    default:
      throw new Error(`Unsupported default value type: ${typeof defaultValue}`);
  }
}

export function getKotlinTypeFromDefaultValue(
  defaultValue: FeatureFlagValue,
): string {
  switch (typeof defaultValue) {
    case 'boolean':
      return 'Boolean';
    case 'number':
      return 'Int';
    case 'string':
      return 'String';
    default:
      throw new Error(`Unsupported default value type: ${typeof defaultValue}`);
  }
}

export const DO_NOT_MODIFY_COMMENT = `/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */`;
