/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {NativeEventSubscription} from '../EventEmitter/RCTNativeAppEventEmitter';

type ColorSchemeName = 'light' | 'dark' | null | undefined;

export namespace Appearance {
  type AppearancePreferences = {
    colorScheme: ColorSchemeName;
  };

  type AppearanceListener = (preferences: AppearancePreferences) => void;

  /**
   * Note: Although color scheme is available immediately, it may change at any
   * time. Any rendering logic or styles that depend on this should try to call
   * this function on every render, rather than caching the value (for example,
   * using inline styles rather than setting a value in a `StyleSheet`).
   *
   * Example: `const colorScheme = Appearance.getColorScheme();`
   */
  export function getColorScheme(): ColorSchemeName;

  /**
   * Add an event handler that is fired when appearance preferences change.
   */
  export function addChangeListener(
    listener: AppearanceListener,
  ): NativeEventSubscription;
}

/**
 * A new useColorScheme hook is provided as the preferred way of accessing
 * the user's preferred color scheme (aka Dark Mode).
 */
export function useColorScheme(): ColorSchemeName;
