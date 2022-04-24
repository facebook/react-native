/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {|
    ERROR_CODE_EXCEPTION: number,
    ERROR_CODE_VIEW_NOT_FOUND: number,
  |};
  +onSuccess: (data: string) => void;
  +onFailure: (errorCode: number, error: string) => void;
}

export default (TurboModuleRegistry.get<Spec>('JSDevSupport'): ?Spec);
