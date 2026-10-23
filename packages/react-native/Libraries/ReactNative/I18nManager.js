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
import type {I18nManagerConstants} from './NativeI18nManager';

import EventEmitter from '../vendor/emitter/EventEmitter';
import NativeI18nManager from './NativeI18nManager';
import invariant from 'invariant';

let i18nConstants: I18nManagerConstants = getI18nManagerConstants();

function getI18nManagerConstants(): I18nManagerConstants {
  if (NativeI18nManager) {
    const {isRTL, doLeftAndRightSwapInRTL, localeIdentifier} =
      NativeI18nManager.getConstants();
    return {isRTL, doLeftAndRightSwapInRTL, localeIdentifier};
  }

  return {
    isRTL: false,
    doLeftAndRightSwapInRTL: false,
  };
}

const eventEmitter = new EventEmitter<{
  change: [I18nManagerConstants],
}>();

function updateConstants() {
  const {isRTL, doLeftAndRightSwapInRTL, localeIdentifier} =
    getI18nManagerConstants();

  if (
    isRTL !== i18nConstants.isRTL ||
    doLeftAndRightSwapInRTL !== i18nConstants.doLeftAndRightSwapInRTL ||
    localeIdentifier !== i18nConstants.localeIdentifier
  ) {
    i18nConstants = {isRTL, doLeftAndRightSwapInRTL, localeIdentifier};
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
   * Allows the app to opt in to RTL layout behavior. Should be called early
   * in app startup. Resolves once the layout is updated.
   *
   * @deprecated Set `RCTSupportsRTL` to `true` in Info.plist on iOS, or
   * `android:supportsRtl="true"` in AndroidManifest.xml on Android, instead.
   */
  allowRTL: (shouldAllow: boolean): Promise<void> => {
    if (!NativeI18nManager) {
      return Promise.resolve();
    }

    return NativeI18nManager.allowRTL(shouldAllow).then(updateConstants);
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
   * Controls whether `left`/`right` style properties are automatically swapped
   * in RTL layouts. When enabled, `left` becomes `right` and vice versa.
   *
   * @deprecated Use `start` and `end` style properties, such as
   * `marginStart`, instead.
   */
  swapLeftAndRightInRTL: (flipStyles: boolean) => {
    if (!NativeI18nManager) {
      return;
    }

    NativeI18nManager.swapLeftAndRightInRTL(flipStyles);
  },

  /**
   * Add an event handler. Supported events:
   *
   * - `change`: Fires when `allowRTL` or `forceRTL` changes a constant, with
   *   the new constants.
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
   * Whether left and right style properties are swapped in RTL mode.
   *
   * @deprecated Use `start` and `end` style properties, such as
   * `marginStart`, instead.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get doLeftAndRightSwapInRTL(): I18nManagerConstants['doLeftAndRightSwapInRTL'] {
    return i18nConstants.doLeftAndRightSwapInRTL;
  },
};
