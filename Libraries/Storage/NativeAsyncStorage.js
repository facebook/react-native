/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  +multiGet: (
    keys: Array<string>,
    callback: (
      errors: ?Array<{|message: string|}>,
      kvPairs: ?Array<Array<string>>,
    ) => void,
  ) => void;
  +multiSet: (
    kvPairs: Array<Array<string>>,
    callback: (errors: ?Array<{|message: string|}>) => void,
  ) => void;
  +multiMerge: (
    kvPairs: Array<Array<string>>,
    callback: (errors: ?Array<{|message: string|}>) => void,
  ) => void;
  +multiRemove: (
    keys: Array<string>,
    callback: (errors: ?Array<{|message: string|}>) => void,
  ) => void;
  +clear: (callback: (error: {|message: string|}) => void) => void;
  +getAllKeys: (
    callback: (error: ?{|message: string|}, allKeys: ?Array<string>) => void,
  ) => void;
}

export default (TurboModuleRegistry.get<Spec>('AsyncSQLiteDBStorage') ||
  TurboModuleRegistry.get<Spec>('AsyncLocalStorage'): ?Spec);
