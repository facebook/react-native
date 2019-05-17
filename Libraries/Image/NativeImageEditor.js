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

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';

type cropOptions = {
  offset: {|
    x: number,
    y: number,
  |},

  size: {|
    width: number,
    height: number,
  |},
  // IOS ONLY
  displaySize?: ?{|
    width: number,
    height: number,
  |},
  // IOS ONLY
  resizeMode?: ?$Enum<{
    contain: string,
    cover: string,
    stretch: string,
  }>,
};

export interface Spec extends TurboModule {
  +cropImage: (
    uri: string,
    options: cropOptions,
    success: (uri: string) => void,
    error: (error: string) => void,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ImageEditingManager');
