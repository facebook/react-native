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
    // TODO(macOS GH#774) - For some reason, yarn lint complains here with this error:
    //   "Unsupported type 'object' for Spec interface. See https://fburl.com/rn-nativemodules for more details"
    // The link in the error is restricted to Facebook employees, so we can't access this info.
    // 3a6327a5d9ebfd0de56c37009ab7de1d0e6bdf85 apparently solves this in other places by disabling the error,
    // so we might as well do the same thing here.
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
