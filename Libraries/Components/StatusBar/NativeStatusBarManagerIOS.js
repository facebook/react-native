/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import {TurboModuleRegistry, type TurboModule} from 'react-native';

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

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'StatusBarManager',
): Spec);
