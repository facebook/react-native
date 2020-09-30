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

import * as React from 'react';

import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {ViewProps} from '../View/ViewPropTypes';
import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {NativeOrDynamicColorType} from '../../StyleSheet/NativeOrDynamicColorType'; // TODO(macOS ISS#2323203)

type CheckBoxEvent = SyntheticEvent<
  $ReadOnly<{|
    target: number,
    value: boolean,
  |}>,
>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * Used in case the props change removes the component.
   */
  onChange?: ?(event: CheckBoxEvent) => mixed,

  /**
   * Invoked with the new value when the value changes.
   */
  onValueChange?: ?(value: boolean) => mixed,

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: ?string,

  on?: ?boolean,
  enabled?: boolean,
  tintColors:
    | {|
        true: ?(number | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
        false: ?(number | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
      |}
    | typeof undefined,
|}>;

type NativeType = HostComponent<NativeProps>;

interface NativeCommands {
  +setNativeValue: (
    viewRef: React.ElementRef<NativeType>,
    value: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeValue'],
});

export default (requireNativeComponent<NativeProps>(
  'AndroidCheckBox',
): NativeType);
