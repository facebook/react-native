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

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  // Android only
  +getConstants: () => {|
    +HEIGHT: number,
    +DEFAULT_BACKGROUND_COLOR: number,
  |};
  +setColor: (color: number, animated: boolean) => void;
  +setTranslucent: (translucent: boolean) => void;

  // iOS only
  // TODO(T47754272) Can we remove this method?
  +getHeight: (callback: (result: {|height: number|}) => void) => void;
  +setNetworkActivityIndicatorVisible: (visible: boolean) => void;
  +addListener: (eventType: string) => void;
  +removeListeners: (count: number) => void;

  // Android and iOS
  /**
   *  - animated is iOS only
   *  - statusBarStyles can be:
   *    - 'default' (iOS and Android)
   *    - 'dark-content' (iOS and Android)
   *    - 'light-content' (iOS)
   */
  +setStyle: (statusBarStyle?: ?string, animated?: ?boolean) => void;
  /**
   *  - withAnimation is iOS only
   *  - withAnimation can be: 'none' | 'fade' | 'slide'
   */
  +setHidden: (hidden: boolean, withAnimation?: ?string) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'StatusBarManager',
): Spec);
