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
import type {I18nManagerConstants as NativeI18nManagerConstants} from './NativeI18nManager';

import warnOnce from '../Utilities/warnOnce';
import EventEmitter from '../vendor/emitter/EventEmitter';
import NativeI18nManager from './NativeI18nManager';
import invariant from 'invariant';

export type I18nManagerConstants = {
  isRTL: boolean,
  localeIdentifier?: ?string,
  /**
   * @deprecated Has no effect, and is always `false`. Use `start` and `end`
   * style properties, such as `marginStart`, instead.
   */
  doLeftAndRightSwapInRTL: boolean,
};

function warnDoLeftAndRightSwapInRTLDeprecated(): void {
  warnOnce(
    'I18nManager.doLeftAndRightSwapInRTL',
    'I18nManager.doLeftAndRightSwapInRTL is deprecated and has no effect, it is ' +
      'always false. Use `start` and `end` style properties, such as ' +
      '`marginStart`, instead.',
  );
}

const createConstants = (
  constants: NativeI18nManagerConstants,
): I18nManagerConstants => ({
  isRTL: constants.isRTL,
  localeIdentifier: constants.localeIdentifier,
  // $FlowFixMe[unsafe-getters-setters]
  get doLeftAndRightSwapInRTL(): boolean {
    warnDoLeftAndRightSwapInRTLDeprecated();
    return false;
  },
});

const getNativeConstants = (): NativeI18nManagerConstants =>
  NativeI18nManager?.getConstants() ?? {isRTL: false};

let i18nConstants: I18nManagerConstants = createConstants(getNativeConstants());

const eventEmitter = new EventEmitter<{
  change: [I18nManagerConstants],
}>();

function updateConstants(): void {
  const nativeConstants = getNativeConstants();

  if (
    nativeConstants.isRTL !== i18nConstants.isRTL ||
    nativeConstants.localeIdentifier !== i18nConstants.localeIdentifier
  ) {
    i18nConstants = createConstants(nativeConstants);
    eventEmitter.emit('change', i18nConstants);
  }
}

/**
 * Utilities for managing Right-to-Left (RTL) layout support.
 *
 * @see https://reactnative.dev/docs/i18nmanager
 */
export default {
  getConstants: (): I18nManagerConstants => {
    return i18nConstants;
  },

  /**
   * @deprecated Has no effect. Set `RCTSupportsRTL` to `true` in Info.plist on
   * iOS, or `android:supportsRtl="true"` in AndroidManifest.xml on Android,
   * instead.
   */
  allowRTL: (shouldAllow: boolean): void => {
    warnOnce(
      'I18nManager.allowRTL',
      'I18nManager.allowRTL() is deprecated and has no effect. Set ' +
        '`RCTSupportsRTL` to `true` in Info.plist on iOS, or ' +
        '`android:supportsRtl="true"` in AndroidManifest.xml on Android, ' +
        'instead.',
    );
  },

  /**
   * Forces the app into RTL layout mode, regardless of the device locale.
   * Resolves once the layout is updated.
   */
  forceRTL: (shouldForce: boolean): Promise<void> => {
    if (!NativeI18nManager) {
      return Promise.resolve();
    }

    return NativeI18nManager.forceRTL(shouldForce).then(updateConstants);
  },

  /**
   * @deprecated Has no effect. Use `start` and `end` style properties, such as
   * `marginStart`, instead.
   */
  swapLeftAndRightInRTL: (flipStyles: boolean): void => {
    warnOnce(
      'I18nManager.swapLeftAndRightInRTL',
      'I18nManager.swapLeftAndRightInRTL() is deprecated and has no effect. ' +
        'Use `start` and `end` style properties, such as `marginStart`, ' +
        'instead.',
    );
  },

  /**
   * Add an event handler. Supported events:
   *
   * - `change`: Fires when `forceRTL` changes a constant, with the new
   *   constants.
   */
  addEventListener: (
    type: 'change',
    handler: (constants: I18nManagerConstants) => void,
  ): EventSubscription => {
    invariant(
      type === 'change',
      'Trying to subscribe to unknown event: "%s"',
      type,
    );
    return eventEmitter.addListener(type, handler);
  },

  /** Whether the current layout direction is Right-to-Left. */
  // $FlowFixMe[unsafe-getters-setters]
  get isRTL(): I18nManagerConstants['isRTL'] {
    return i18nConstants.isRTL;
  },

  /**
   * @deprecated Has no effect, and is always `false`. Use `start` and `end`
   * style properties, such as `marginStart`, instead.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get doLeftAndRightSwapInRTL(): I18nManagerConstants['doLeftAndRightSwapInRTL'] {
    warnDoLeftAndRightSwapInRTLDeprecated();
    return false;
  },
};
