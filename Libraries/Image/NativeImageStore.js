/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  // Common
  +getBase64ForTag: (
    uri: string,
    successCallback: (base64ImageData: string) => void,

    /**
     * On Android, the failure callback is called with a string.
     * On iOS, the failure callback is called with an error object.
     *
     * TODO(T47527939) Unify this inconsistency
     */
    errorCallback: (error: {|message: string|} | string) => void,
  ) => void;

  // iOS-only
  +hasImageForTag: (uri: string, callback: (hasImage: boolean) => void) => void;
  +removeImageForTag: (uri: string) => void;
  +addImageFromBase64: (
    base64ImageData: string,
    successCallback: (uri: string) => void,
    errorCallback: (error: {|message: string|}) => void,
  ) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'ImageStoreManager',
): Spec);
