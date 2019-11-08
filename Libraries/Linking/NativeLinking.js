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

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';
import Platform from '../Utilities/Platform';

export interface Spec extends TurboModule {
  // Common interface
  +getInitialURL: () => Promise<string>;
  +canOpenURL: (url: string) => Promise<boolean>;
  +openURL: (url: string) => Promise<void>;
  +openSettings: () => Promise<void>;

  // Android only
  +sendIntent: (
    action: string,
    extras: ?Array<{key: string, value: string | number | boolean}>,
  ) => Promise<void>;

  // Events
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default ((Platform.OS === 'android'
  ? TurboModuleRegistry.getEnforcing<Spec>('IntentAndroid')
  : TurboModuleRegistry.getEnforcing<Spec>('LinkingManager')): Spec);
