/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {FeatureFlagValue} from '../../../packages/react-native/scripts/featureflags/types';
import type {FantomTestConfig} from '../runner/getFantomTestConfigs';
import type {HermesVariant} from '../runner/utils';
import type {PartialFantomTestConfig} from './getFantomTestConfigs';

import {FantomTestConfigHermesVariant} from '../runner/getFantomTestConfigs';
import {getOverrides} from './getFantomTestConfigs';

function formatModes(overrides: PartialFantomTestConfig) {
  const parts = [];

  if (
    overrides.isNativeOptimized === false &&
    overrides.isJsOptimized === false &&
    overrides.isJsBytecode === false
  ) {
    return ['mode 🐛'];
  } else if (
    overrides.isNativeOptimized === true &&
    overrides.isJsOptimized === true &&
    overrides.isJsBytecode === true
  ) {
    return ['mode 🚀'];
  }

  if (overrides.isNativeOptimized != null) {
    parts.push(overrides.isNativeOptimized ? 'native 🚀' : 'native 🐛');
  }

  if (overrides.isJsOptimized != null) {
    parts.push(overrides.isJsOptimized ? 'js 🚀' : 'js 🐛');
  }

  if (overrides.isJsBytecode != null && overrides.isJsBytecode) {
    parts.push('bytecode');
  }

  return parts;
}

function formatFantomHermesVariant(hermesVariant: HermesVariant): string {
  switch (hermesVariant) {
    case FantomTestConfigHermesVariant.Hermes:
      return 'hermes';
    case FantomTestConfigHermesVariant.StaticHermesStable:
      return 'shermes 🆕';
    case FantomTestConfigHermesVariant.StaticHermesExperimental:
      return 'shermes 🧪';
  }
}

function formatFantomFeatureFlag(
  flagName: string,
  flagValue: FeatureFlagValue,
): string {
  if (typeof flagValue === 'boolean') {
    return `${flagName} ${flagValue ? '✅' : '🛑'}`;
  }

  return `🔐 ${flagName} = ${flagValue}`;
}

export default function formatFantomConfig(config: FantomTestConfig): string {
  const overrides = getOverrides(config);
  const parts = [];

  parts.push(...formatModes(overrides));

  if (overrides.hermesVariant) {
    parts.push(formatFantomHermesVariant(overrides.hermesVariant));
  }

  if (overrides.flags) {
    for (const flagType of ['common', 'jsOnly', 'reactInternal'] as const) {
      if (overrides.flags[flagType]) {
        for (const [flagName, flagValue] of Object.entries(
          overrides.flags[flagType],
        )) {
          parts.push(formatFantomFeatureFlag(flagName, flagValue));
        }
      }
    }
  }

  return parts.join(', ');
}
