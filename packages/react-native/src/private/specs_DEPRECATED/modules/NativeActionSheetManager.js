/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {};
  +showActionSheetWithOptions: (
    options: {
      +title?: ?string,
      +message?: ?string,
      +options: ?Array<string>,
      +destructiveButtonIndices?: ?Array<number>,
      +cancelButtonIndex?: ?number,
      +anchor?: ?number,
      +tintColor?: ?number,
      +cancelButtonTintColor?: ?number,
      +disabledButtonTintColor?: ?number,
      +userInterfaceStyle?: ?string,
      +disabledButtonIndices?: Array<number>,
    },
    callback: (buttonIndex: number) => void,
  ) => void;
  +showShareActionSheetWithOptions: (
    options: {
      +message?: ?string,
      +url?: ?string,
      +subject?: ?string,
      +anchor?: ?number,
      +tintColor?: ?number,
      +cancelButtonTintColor?: ?number,
      +disabledButtonTintColor?: ?number,
      +excludedActivityTypes?: ?Array<string>,
      +userInterfaceStyle?: ?string,
    },
    failureCallback: (error: {
      +domain: string,
      +code: string,
      +userInfo?: ?Object,
      +message: string,
    }) => void,
    successCallback: (completed: boolean, activityType: ?string) => void,
  ) => void;
  +dismissActionSheet?: () => void;
}

export default (TurboModuleRegistry.get<Spec>('ActionSheetManager'): ?Spec);
