/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventSubscription} from '../vendor/emitter/EventEmitter';
import type {AppearancePreferences, ColorSchemeName} from './NativeAppearance';
import typeof INativeAppearance from './NativeAppearance';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import EventEmitter from '../vendor/emitter/EventEmitter';
import invariant from 'invariant';

export type {AppearancePreferences};

type Appearance = {
  colorScheme: ?ColorSchemeName,
};

let lazyState: ?{
  +NativeAppearance: INativeAppearance,
  // Cache the color scheme to reduce the cost of reading it between changes.
  // NOTE: If `NativeAppearance` is null, this will always be null.
  appearance: ?Appearance,
  // NOTE: This is non-nullable to make it easier for `onChangedListener` to
  // return a non-nullable `EventSubscription` value. This is not the common
  // path, so we do not have to over-optimize it.
  +eventEmitter: EventEmitter<{change: [Appearance]}>,
};

/**
 * Ensures that all state and listeners are lazily initialized correctly.
 */
function getState(): $NonMaybeType<typeof lazyState> {
  if (lazyState != null) {
    return lazyState;
  }
  const eventEmitter = new EventEmitter<{change: [Appearance]}>();
  // NOTE: Avoid initializing `NativeAppearance` until it is actually used.
  const NativeAppearance = require('./NativeAppearance').default;
  if (NativeAppearance == null) {
    // Assign `null` to avoid re-initializing on subsequent invocations.
    lazyState = {
      NativeAppearance: null,
      appearance: null,
      eventEmitter,
    };
  } else {
    const state: $NonMaybeType<typeof lazyState> = {
      NativeAppearance,
      appearance: null,
      eventEmitter,
    };
    new NativeEventEmitter<{
      appearanceChanged: [AppearancePreferences],
    }>(NativeAppearance).addListener('appearanceChanged', newAppearance => {
      state.appearance = {
        colorScheme: toColorScheme(newAppearance.colorScheme),
      };
      eventEmitter.emit('change', state.appearance);
    });
    lazyState = state;
  }
  return lazyState;
}

/**
 * Returns the current color scheme preference. This value may change, so the
 * value should not be cached without either listening to changes or using
 * the `useColorScheme` hook.
 */
export function getColorScheme(): ?ColorSchemeName {
  let colorScheme = null;
  const state = getState();
  const {NativeAppearance} = state;
  if (NativeAppearance != null) {
    if (state.appearance == null) {
      // Lazily initialize `state.appearance`. This should only
      // happen once because we never reassign a null value to it.
      state.appearance = {
        colorScheme: toColorScheme(NativeAppearance.getColorScheme()),
      };
    }
    colorScheme = state.appearance.colorScheme;
  }
  return colorScheme;
}

/**
 * Updates the current color scheme to the supplied value.
 */
export function setColorScheme(colorScheme: ?ColorSchemeName): void {
  const state = getState();
  const {NativeAppearance} = state;
  if (NativeAppearance != null) {
    NativeAppearance.setColorScheme(colorScheme ?? 'unspecified');
    state.appearance = {
      colorScheme: toColorScheme(NativeAppearance.getColorScheme()),
    };
  }
}

/**
 * Add an event handler that is fired when appearance preferences change.
 */
export function addChangeListener(
  listener: ({colorScheme: ?ColorSchemeName}) => void,
): EventSubscription {
  const {eventEmitter} = getState();
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
