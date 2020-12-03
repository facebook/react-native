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

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getInitialURL: () => Promise<string>;
  +canOpenURL: (url: string) => Promise<boolean>;
  +openURL: (url: string) => Promise<void>;
  +openSettings: () => Promise<void>;
  +sendIntent: (
    action: string,
    extras: ?Array<{
      key: string,
      value: string | number | boolean, // TODO(T67672788): Union types are not type safe
      ...
    }>,
  ) => Promise<void>;
}

export default (TurboModuleRegistry.get<Spec>('IntentAndroid'): ?Spec);
