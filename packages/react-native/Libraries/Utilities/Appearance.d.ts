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
   * Set the color scheme preference. This is useful for overriding the default
   * color scheme preference for the app. Note that this will not change the
   * appearance of the system UI, only the appearance of the app.
   * Only available on iOS 13+ and Android 10+.
   */
  export function setColorScheme(
    scheme: ColorSchemeName | null | undefined,
  ): void;

  /**
   * Add an event handler that is fired when appearance preferences change.
   */
  export function addChangeListener(
    listener: AppearanceListener,
  ): NativeEventSubscription;
}

/**
 * A new useColorScheme hook is provided as the preferred way of accessing
 * the user's preferred color scheme (e.g. Dark Mode).
 */
export function useColorScheme(): ColorSchemeName;
