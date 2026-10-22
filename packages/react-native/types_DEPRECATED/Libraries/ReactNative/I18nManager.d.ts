/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {EmitterSubscription} from '../vendor/emitter/EventEmitter';

type I18nManagerConstants = {
  isRTL: boolean;
  /**
   * @deprecated Use `start` and `end` style properties, such as
   * `marginStart`, instead.
   */
  doLeftAndRightSwapInRTL: boolean;
  localeIdentifier?: string | null | undefined;
};

export interface I18nManagerStatic {
  getConstants: () => I18nManagerConstants;
  allowRTL: (allowRTL: boolean) => void;
  forceRTL: (forceRTL: boolean) => void;
  /**
   * @deprecated Use `start` and `end` style properties, such as
   * `marginStart`, instead.
   */
  swapLeftAndRightInRTL: (swapLeftAndRight: boolean) => void;
  relayout: () => Promise<void>;
  addEventListener: (
    type: 'change',
    handler: (constants: I18nManagerConstants) => void,
  ) => EmitterSubscription;
  isRTL: boolean;
  /**
   * @deprecated Use `start` and `end` style properties, such as
   * `marginStart`, instead.
   */
  doLeftAndRightSwapInRTL: boolean;
}

/** https://reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps */
export const I18nManager: I18nManagerStatic;
export type I18nManager = I18nManagerStatic;
