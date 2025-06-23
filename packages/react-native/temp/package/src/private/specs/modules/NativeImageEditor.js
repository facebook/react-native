/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

type Options = {|
  +offset: {|
    +x: number,
    +y: number,
  |},
  +size: {|
    +width: number,
    +height: number,
  |},
  +displaySize?: ?{|
    +width: number,
    +height: number,
  |},
  /**
   * Enum with potential values:
   *  - cover
   *  - contain
   *  - stretch
   *  - center
   *  - repeat
   */
  +resizeMode?: ?string,
  +allowExternalStorage?: boolean,
|};

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  +cropImage: (
    uri: string,
    cropData: Options,
    successCallback: (uri: string) => void,
    errorCallback: (error: string) => void,
  ) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'ImageEditingManager',
): Spec);
