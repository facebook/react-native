/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {|
    +HEIGHT: number,
    +DEFAULT_BACKGROUND_COLOR?: number,
  |};

  // TODO(T47754272) Can we remove this method?
  +getHeight: (callback: (result: {|height: number|}) => void) => void;
  +setNetworkActivityIndicatorVisible: (visible: boolean) => void;
  +addListener: (eventType: string) => void;
  +removeListeners: (count: number) => void;

  /**
   *  - statusBarStyles can be:
   *    - 'default'
   *    - 'dark-content'
   *    - 'light-content'
   */
  +setStyle: (statusBarStyle?: ?string, animated: boolean) => void;
  /**
   *  - withAnimation can be: 'none' | 'fade' | 'slide'
   */
  +setHidden: (hidden: boolean, withAnimation: string) => void;
}

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>('StatusBarManager');
let constants = null;

const NativeStatusBarManager = {
  getConstants(): {|
    +HEIGHT: number,
    +DEFAULT_BACKGROUND_COLOR?: number,
  |} {
    if (constants == null) {
      constants = NativeModule.getConstants();
    }
    return constants;
  },

  // TODO(T47754272) Can we remove this method?
  getHeight(callback: (result: {|height: number|}) => void): void {
    NativeModule.getHeight(callback);
  },

  setNetworkActivityIndicatorVisible(visible: boolean): void {
    NativeModule.setNetworkActivityIndicatorVisible(visible);
  },

  addListener(eventType: string): void {
    NativeModule.addListener(eventType);
  },

  removeListeners(count: number): void {
    NativeModule.removeListeners(count);
  },

  /**
   *  - statusBarStyles can be:
   *    - 'default'
   *    - 'dark-content'
   *    - 'light-content'
   */
  setStyle(statusBarStyle?: ?string, animated: boolean): void {
    NativeModule.setStyle(statusBarStyle, animated);
  },

  /**
   *  - withAnimation can be: 'none' | 'fade' | 'slide'
   */
  setHidden(hidden: boolean, withAnimation: string): void {
    NativeModule.setHidden(hidden, withAnimation);
  },
};

export default NativeStatusBarManager;
