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
import type {ProcessedColorValue} from '../StyleSheet/processColor'; // TODO(macOS GH#774)

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  +showActionSheetWithOptions: (
    // TODO(macOS GH#774)
    // eslint-disable-next-line @react-native/codegen/react-native-modules
    options: {|
      +title?: ?string,
      +message?: ?string,
      +options: ?Array<string>,
      +destructiveButtonIndices?: ?Array<number>,
      +cancelButtonIndex?: ?number,
      +anchor?: ?number,
      +tintColor?: ?ProcessedColorValue, // TODO(macOS GH#774)
      +userInterfaceStyle?: ?string,
    |},
    callback: (buttonIndex: number) => void,
  ) => void;
  +showShareActionSheetWithOptions: (
    options: {|
      +message?: ?string,
      +url?: ?string,
      +subject?: ?string,
      +anchor?: ?number,
      +tintColor?: ?ProcessedColorValue, // TODO(macOS GH#774)
      +excludedActivityTypes?: ?Array<string>,
      +userInterfaceStyle?: ?string,
    |},
    failureCallback: (error: {|
      +domain: string,
      +code: string,
      +userInfo?: ?Object,
      +message: string,
    |}) => void,
    successCallback: (completed: boolean, activityType: ?string) => void,
  ) => void;
}

export default (TurboModuleRegistry.get<Spec>('ActionSheetManager'): ?Spec);
