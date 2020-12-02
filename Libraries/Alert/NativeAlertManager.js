/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';
import type {DefaultInputsArray} from './AlertMacOS'; // TODO(macOS GH#774)

export type Args = {|
  title?: string,
  message?: string,
  buttons?: Array<Object>, // TODO(T67565166): have a better type
  type?: string,
  defaultValue?: string,
  cancelButtonKey?: string,
  destructiveButtonKey?: string,
  keyboardType?: string,
  // [TODO(macOS ISS#2323203)
  defaultInputs?: DefaultInputsArray,
  modal?: ?boolean,
  critical?: ?boolean,
  // ]TODO(macOS ISS#2323203)
|};

export interface Spec extends TurboModule {
  +alertWithArgs: (
    args: NativeArgs, // TODO(macOS GH#774): Args -> NativeArgs
    callback: (id: number, value: string) => void,
  ) => void;
}

export default (TurboModuleRegistry.get<Spec>('AlertManager'): ?Spec);
