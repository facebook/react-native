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
  string?: string | undefined;
  number?: number | undefined;
  boolean?: boolean | undefined;
  default?: WithDefault<'option1' | 'option2', 'option1'> | undefined;
  double?: Double | undefined;
  float?: Float | undefined;
  int32?: Int32 | undefined;
  unsafeObject?: UnsafeObject | undefined;
  onBubblingEventHandler?: BubblingEventHandler<Event> | undefined;
  onDirectEventHandler?: DirectEventHandler<Event> | undefined;
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
