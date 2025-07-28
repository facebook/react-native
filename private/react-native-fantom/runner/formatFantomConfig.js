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
  FantomTestConfigHermesVariant,
  FantomTestConfigMode,
} from '../runner/getFantomTestConfigs';
import {getOverrides} from './getFantomTestConfigs';

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

  if (overrides.mode) {
    parts.push(formatFantomMode(overrides.mode));
  }

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
