/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  ReactNativeFeatureFlagsJsOnly,
  ReactNativeFeatureFlagsJsOnlyOverrides,
} from './ReactNativeFeatureFlags';

import NativeReactNativeFeatureFlags from './specs/NativeReactNativeFeatureFlags';

const accessedFeatureFlags: Set<string> = new Set();
let overrides: ?ReactNativeFeatureFlagsJsOnlyOverrides;

export type Getter<T> = () => T;

// This defines the types for the overrides object, whose methods also receive
// the default value as a parameter.
export type OverridesFor<T> = Partial<{
  [key in keyof T]: (ReturnType<T[key]>) => ReturnType<T[key]>,
}>;

function createGetter<T: boolean | number | string>(
  configName: string,
  customValueGetter: Getter<?T>,
  defaultValue: T,
): Getter<T> {
  let cachedValue: ?T;

  return () => {
    if (cachedValue == null) {
      cachedValue = customValueGetter() ?? defaultValue;
    }
    return cachedValue;
  };
}

export function createJavaScriptFlagGetter<
  K: $Keys<ReactNativeFeatureFlagsJsOnly>,
>(
  configName: K,
  defaultValue: ReturnType<ReactNativeFeatureFlagsJsOnly[K]>,
): Getter<ReturnType<ReactNativeFeatureFlagsJsOnly[K]>> {
  return createGetter(
    configName,
    () => {
      accessedFeatureFlags.add(configName);
      return overrides?.[configName]?.(defaultValue);
    },
    defaultValue,
  );
}

type NativeFeatureFlags = $NonMaybeType<typeof NativeReactNativeFeatureFlags>;

export function createNativeFlagGetter<K: $Keys<NativeFeatureFlags>>(
  configName: K,
  defaultValue: ReturnType<$NonMaybeType<NativeFeatureFlags[K]>>,
): Getter<ReturnType<$NonMaybeType<NativeFeatureFlags[K]>>> {
  return createGetter(
    configName,
    () => {
      const valueFromNative = NativeReactNativeFeatureFlags?.[configName]?.();
      if (valueFromNative == null) {
        logUnavailableNativeModuleError(configName);
      }
      return valueFromNative;
    },
    defaultValue,
  );
}

export function getOverrides(): ?ReactNativeFeatureFlagsJsOnlyOverrides {
  return overrides;
}

export function setOverrides(
  newOverrides: ReactNativeFeatureFlagsJsOnlyOverrides,
): void {
  if (overrides != null) {
    throw new Error('Feature flags cannot be overridden more than once');
  }

  if (accessedFeatureFlags.size > 0) {
    const accessedFeatureFlagsStr = Array.from(accessedFeatureFlags).join(', ');
    throw new Error(
      `Feature flags were accessed before being overridden: ${accessedFeatureFlagsStr}`,
    );
  }

  overrides = newOverrides;
}

const reportedConfigNames: Set<string> = new Set();

function logUnavailableNativeModuleError(configName: string): void {
  if (!reportedConfigNames.has(configName)) {
    reportedConfigNames.add(configName);
    console.error(
      `Could not access feature flag '${configName}' because native module method was not available`,
    );
  }
}
