/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

/* 'buttonClicked' | 'dismissed' */
type DialogAction = string;
/*
  buttonPositive = -1,
  buttonNegative = -2,
  buttonNeutral = -3
*/
type DialogButtonKey = number;
export type DialogOptions = {|
  title?: string,
  message?: Stringish,
  buttonPositive?: Stringish,
  buttonNegative?: Stringish,
  buttonNeutral?: Stringish,
  items?: Array<string>,
  cancelable?: boolean,
|};

export interface Spec extends TurboModule {
  +getConstants: () => {|
    +buttonClicked: DialogAction,
    +dismissed: DialogAction,
    +buttonPositive: DialogButtonKey,
    +buttonNegative: DialogButtonKey,
    +buttonNeutral: DialogButtonKey,
  |};
  +showAlert: (
    config: DialogOptions,
    onError: (string) => void,
    onAction: (action: DialogAction, buttonKey?: DialogButtonKey) => void,
  ) => void;
}

export default TurboModuleRegistry.get<Spec>('DialogManagerAndroid');
