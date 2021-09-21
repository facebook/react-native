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
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

let NativeModule: ?Spec = null;

const wrapperModule = {
  addListener(eventName: string) {
    if (NativeModule == null) {
      NativeModule = TurboModuleRegistry.get<Spec>('TVNavigationEventEmitter');
    }
    NativeModule && NativeModule.addListener(eventName);
  },

  removeListeners(count: number) {
    if (NativeModule == null) {
      NativeModule = TurboModuleRegistry.get<Spec>('TVNavigationEventEmitter');
    }
    NativeModule && NativeModule.removeListeners(count);
  },
};

export default wrapperModule;
