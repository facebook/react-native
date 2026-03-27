/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getViewTransitionInstance: (
    name: string,
    pseudo: string,
  ) => ?{
    x: number,
    y: number,
    width: number,
    height: number,
    nativeTag: number,
  };
}

export default (TurboModuleRegistry.get<Spec>(
  'NativeViewTransitionCxx',
): ?Spec);
