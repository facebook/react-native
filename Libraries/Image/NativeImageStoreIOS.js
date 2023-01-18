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
  +getConstants: () => {||};
  +getBase64ForTag: (
    uri: string,
    successCallback: (base64ImageData: string) => void,
    errorCallback: (error: {|message: string|}) => void,
  ) => void;
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
