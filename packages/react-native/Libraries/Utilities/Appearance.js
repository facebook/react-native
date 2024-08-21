/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import EventEmitter, {
  type EventSubscription,
} from '../vendor/emitter/EventEmitter';
import {isAsyncDebugging} from './DebugEnvironment';
import NativeAppearance, {
  type AppearancePreferences,
  type ColorSchemeName,
} from './NativeAppearance';
import invariant from 'invariant';

const eventEmitter = new EventEmitter<{
  change: [{colorScheme: ?ColorSchemeName}],
}>();

type NativeAppearanceEventDefinitions = {
  appearanceChanged: [AppearancePreferences],
};

if (NativeAppearance != null) {
  new NativeEventEmitter<NativeAppearanceEventDefinitions>(
    NativeAppearance,
  ).addListener('appearanceChanged', (newAppearance: AppearancePreferences) => {
    const colorScheme = toColorScheme(newAppearance.colorScheme);
    eventEmitter.emit('change', {colorScheme});
  });
}

/**
 * Returns the current color scheme preference. This value may change, so the
 * value should not be cached without either listening to changes or using
 * the `useColorScheme` hook.
 */
export function getColorScheme(): ?ColorSchemeName {
  if (__DEV__) {
    if (isAsyncDebugging) {
      // Hard code light theme when using the async debugger as
      // sync calls aren't supported
      return 'light';
    }
  }
  return toColorScheme(NativeAppearance?.getColorScheme());
}

/**
 * Updates the current color scheme to the supplied value.
 */
export function setColorScheme(colorScheme: ?ColorSchemeName): void {
  NativeAppearance?.setColorScheme(toColorScheme(colorScheme) ?? 'unspecified');
}

/**
 * Add an event handler that is fired when appearance preferences change.
 */
export function addChangeListener(
  listener: ({colorScheme: ?ColorSchemeName}) => void,
): EventSubscription {
  return eventEmitter.addListener('change', listener);
}

/**
 * TODO: (hramos) T52919652 Use ?ColorSchemeName once codegen supports union
 */
function toColorScheme(colorScheme: ?string): ?ColorSchemeName {
  invariant(
    colorScheme === 'dark' || colorScheme === 'light' || colorScheme == null,
    "Unrecognized color scheme. Did you mean 'dark', 'light' or null?",
  );
  return colorScheme;
}
