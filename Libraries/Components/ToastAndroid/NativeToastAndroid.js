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

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {|
    SHORT: number,
    LONG: number,
    TOP: number,
    BOTTOM: number,
    CENTER: number,
  |};
  +show: (message: string, duration: number) => void;
  +showWithGravity: (
    message: string,
    duration: number,
    gravity: number,
  ) => void;
  +showWithGravityAndOffset: (
    message: string,
    duration: number,
    gravity: number,
    xOffset: number,
    yOffset: number,
  ) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>('ToastAndroid'): Spec);
