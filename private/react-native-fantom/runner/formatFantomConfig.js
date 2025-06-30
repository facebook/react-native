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

import {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_HERMES_VARIANT,
  DEFAULT_MODE,
  FantomTestConfigHermesVariant,
  FantomTestConfigMode,
} from '../runner/getFantomTestConfigs';

function formatFantomMode(mode: FantomTestConfigMode): string {
  switch (mode) {
    case FantomTestConfigMode.DevelopmentWithSource:
      return 'mode 🐛';
    case FantomTestConfigMode.DevelopmentWithBytecode:
      return 'mode 🐛🔢';
    case FantomTestConfigMode.Optimized:
      return 'mode 🚀';
  }
}

function formatFantomHermesVariant(hermesVariant: HermesVariant): string {
  switch (hermesVariant) {
    case FantomTestConfigHermesVariant.Hermes:
      return 'hermes';
    case FantomTestConfigHermesVariant.StaticHermesStable:
      return 'shermes 🆕';
    case FantomTestConfigHermesVariant.StaticHermesStaging:
      return 'shermes ⏭️';
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
  const parts = [];

  if (config.mode !== DEFAULT_MODE) {
    parts.push(formatFantomMode(config.mode));
  }

  if (config.hermesVariant !== DEFAULT_HERMES_VARIANT) {
    parts.push(formatFantomHermesVariant(config.hermesVariant));
  }

  for (const flagType of ['common', 'jsOnly', 'reactInternal'] as const) {
    for (const [flagName, flagValue] of Object.entries(
      config.flags[flagType],
    )) {
      if (flagValue !== DEFAULT_FEATURE_FLAGS[flagType][flagName]) {
        parts.push(formatFantomFeatureFlag(flagName, flagValue));
      }
    }
  }

  return parts.join(', ');
}
