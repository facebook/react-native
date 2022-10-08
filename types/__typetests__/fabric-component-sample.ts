/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import codegenNativeComponent, {
  NativeComponentType,
} from 'react-native/Libraries/Utilities/codegenNativeComponent';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import {
  WithDefault,
  Double,
  Float,
  Int32,
  UnsafeObject,
  BubblingEventHandler,
  DirectEventHandler,
} from 'react-native/Libraries/Types/CodegenTypes';
import type {ViewProps} from 'react-native';

type Event = Readonly<{
  value: Double;
}>;

interface NativeProps extends ViewProps {
  string?: string;
  number?: number;
  boolean?: boolean;
  default?: WithDefault<'option1' | 'option2', 'option1'>;
  double?: Double;
  float?: Float;
  int32?: Int32;
  unsafeObject?: UnsafeObject;
  onBubblingEventHandler?: BubblingEventHandler<Event>;
  onDirectEventHandler?: DirectEventHandler<Event>;
}

export type SampleViewType = NativeComponentType<NativeProps>;

interface NativeCommands {
  changeBackgroundColor: (
    viewRef: React.ElementRef<SampleViewType>,
    color: string,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['changeBackgroundColor'],
});

export default codegenNativeComponent<NativeProps>('SampleView');
