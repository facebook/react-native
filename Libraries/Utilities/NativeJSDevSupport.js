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
    ERROR_CODE_EXCEPTION: number,
    ERROR_CODE_VIEW_NOT_FOUND: number,
  |};
  +onSuccess: (data: Object) => void;
  +onFailure: (errorCode: number, error: string) => void;
}

export default (TurboModuleRegistry.get<Spec>('JSDevSupport'): ?Spec);
