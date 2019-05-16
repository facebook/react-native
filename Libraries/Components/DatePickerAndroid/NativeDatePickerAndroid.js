/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';
import Platform from 'Platform';

export interface Spec extends TurboModule {
  +open: () => Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DatePickerAndroid');
