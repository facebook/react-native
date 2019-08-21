/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import EventEmitter from '../vendor/emitter/EventEmitter';
import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import NativeAppearance, {type AppearancePreferences} from './NativeAppearance';
import invariant from 'invariant';

const COLOR_SCHEME_NAME = {
  light: 'light',
  dark: 'dark',
  noPreference: 'no-preference',
};
type ColorSchemeName = $Keys<{
  light: string,
  dark: string,
  noPreference: string,
}>;
type AppearanceListener = (preferences: AppearancePreferences) => void;

const eventEmitter = new EventEmitter();

let appearancePreferencesInitialized = false;
let appearancePreferences: AppearancePreferences;

class Appearance {
  /**
   * Note: Although appearance is available immediately, it may change (e.g
   * Dark Mode) so any rendering logic or styles that depend on this should try
   * to call this function on every render, rather than caching the value (for
   * example, using inline styles rather than setting a value in a
   * `StyleSheet`).
   *
   * Example: `const colorScheme = Appearance.get('colorScheme');`
   *
   * @param {string} preference Name of preference (e.g. 'colorScheme').
   * @returns {ColorSchemeName} Value for the preference.
   */
  static get(preference: string): ColorSchemeName {
    invariant(
      appearancePreferences[preference],
      'No preference set for key ' + preference,
    );
    return appearancePreferences[preference];
  }

  /**
   * This should only be called from native code by sending the
   * appearanceChanged event.
   *
   * @param {object} appearancePreferences Simple string-keyed object of
   * appearance preferences to set.
   */
  static set(preferences: AppearancePreferences): void {
    let {colorScheme} = preferences;
    appearancePreferences = {colorScheme};

    if (appearancePreferencesInitialized) {
      // Don't fire 'change' the first time the dimensions are set.
      eventEmitter.emit('change', preferences);
    } else {
      appearancePreferencesInitialized = true;
    }
  }

  /**
   * Add an event handler that is fired when appearance preferences change.
   */
  static addChangeListener(listener: AppearanceListener): void {
    eventEmitter.addListener('change', listener);
  }

  /**
   * Remove an event handler.
   */
  static removeChangeListener(listener: AppearanceListener): void {
    eventEmitter.removeListener('change', listener);
  }
}

if (NativeAppearance) {
  const nativeEventEmitter = new NativeEventEmitter(NativeAppearance);
  // Subscribe before calling to make sure we don't miss any updates in between.
  nativeEventEmitter.addListener(
    'appearanceChanged',
    (newAppearance: AppearancePreferences) => {
      Appearance.set(newAppearance);
    },
  );
  Appearance.set(NativeAppearance.getPreferences());
} else {
  Appearance.set({colorScheme: 'no-preference'});
}

module.exports = Appearance;
