/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';

import Platform from '../../Utilities/Platform';

export interface Spec extends TurboModule {
  +invokeDefaultBackPressHandler: () => void;
}

export default (Platform.OS === 'android'
  ? TurboModuleRegistry.getEnforcing<Spec>('DeviceEventManager')
  : undefined);
