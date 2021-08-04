/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

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
    // eslint-disable-next-line lint/react-native-modules
    cropData: Options,
    successCallback: (uri: string) => void,
    errorCallback: (error: string) => void,
  ) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'ImageEditingManager',
): Spec);
