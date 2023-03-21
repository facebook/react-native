/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../../TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

/**
 * This file backs native modules that are used internally at Meta
 * and this JS spec was intentionally left here. In the meanwhile this
 * file should not be deleted.
 */
export interface Spec extends TurboModule {
  +open: (options: Object) => Promise<Object>;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'DatePickerAndroid',
): Spec);
