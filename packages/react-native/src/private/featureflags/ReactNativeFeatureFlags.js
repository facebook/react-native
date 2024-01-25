/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<4e4ce58c1ce1a95355bba0dfe099e26e>>
 * @flow strict-local
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.json.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

import {
  type Getter,
  createJavaScriptFlagGetter,
  createNativeFlagGetter,
  setOverrides,
} from './ReactNativeFeatureFlagsBase';

export type ReactNativeFeatureFlagsJsOnly = {
  jsOnlyTestFlag: Getter<boolean>,
};

export type ReactNativeFeatureFlagsJsOnlyOverrides = Partial<ReactNativeFeatureFlagsJsOnly>;

export type ReactNativeFeatureFlags = {
  ...ReactNativeFeatureFlagsJsOnly,
  commonTestFlag: Getter<boolean>,
  useModernRuntimeScheduler: Getter<boolean>,
  enableMicrotasks: Getter<boolean>,
  batchRenderingUpdatesInEventLoop: Getter<boolean>,
}

/**
 * JS-only flag for testing. Do NOT modify.
 */
export const jsOnlyTestFlag: Getter<boolean> = createJavaScriptFlagGetter('jsOnlyTestFlag', false);

/**
 * Common flag for testing. Do NOT modify.
 */
export const commonTestFlag: Getter<boolean> = createNativeFlagGetter('commonTestFlag', false);
/**
 * When enabled, it uses the modern fork of RuntimeScheduler that allows scheduling tasks with priorities from any thread.
 */
export const useModernRuntimeScheduler: Getter<boolean> = createNativeFlagGetter('useModernRuntimeScheduler', false);
/**
 * Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).
 */
export const enableMicrotasks: Getter<boolean> = createNativeFlagGetter('enableMicrotasks', false);
/**
 * When enabled, the RuntimeScheduler processing the event loop will batch all rendering updates and dispatch them together at the end of each iteration of the loop.
 */
export const batchRenderingUpdatesInEventLoop: Getter<boolean> = createNativeFlagGetter('batchRenderingUpdatesInEventLoop', false);

/**
 * Overrides the feature flags with the provided methods.
 * NOTE: Only JS-only flags can be overridden from JavaScript using this API.
 */
export const override = setOverrides;
