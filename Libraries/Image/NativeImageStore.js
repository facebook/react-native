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

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  // Common
  +getBase64ForTag: (
    uri: string,
    success: (base64ImageData: string) => void,
    failure: (error: Object) => void,
  ) => void;

  // iOS-only
  +hasImageForTag: (uri: string, callback: (hasImage: boolean) => void) => void;
  +removeImageForTag: (uri: string) => void;
  +addImageFromBase64: (
    base64ImageData: string,
    success: (uri: string) => void,
    failure: (error: Object) => void,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ImageStoreManager');
