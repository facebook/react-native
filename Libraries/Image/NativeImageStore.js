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

export interface Spec extends TurboModule {
  +hasImageForTag: (
    uri: string, 
    callback: (hasImage: boolean) => void,
  ) => void;
  +removeImageForTag: (
    uri: string,
  ) => void;
  +addImageFromBase64: (
    base64ImageData: string,
    succees: (uri: string) => void,
    failure: (error: string) => void;
  ) => void;
  +getBase64ForTag: (
    uri: string,
    succees: (base64ImageData: string) => void,
    failure: (error: string) => void,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ImageStoringManager');