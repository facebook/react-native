/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from 'react-native';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import type {
  BubblingEventHandler,
  Double,
  Float,
  Int32,
} from 'react-native/Libraries/Types/CodegenTypes';

import * as React from 'react';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type Event = $ReadOnly<{
  values: $ReadOnlyArray<Int32>,
  boolValues: $ReadOnlyArray<boolean>,
  floats: $ReadOnlyArray<Float>,
  doubles: $ReadOnlyArray<Double>,
  yesNos: $ReadOnlyArray<'yep' | 'nope'>,
  strings: $ReadOnlyArray<string>,
  latLons: $ReadOnlyArray<{lat: Double, lon: Double}>,
  multiArrays: $ReadOnlyArray<$ReadOnlyArray<Int32>>,
}>;

type NativeProps = $ReadOnly<{
  ...ViewProps,
  opacity?: Float,
  values: $ReadOnlyArray<Int32>,

  // Events
  onIntArrayChanged?: ?BubblingEventHandler<Event>,
}>;

export type NativeComponentType = HostComponent<NativeProps>;

interface NativeCommands {
  +changeBackgroundColor: (
    viewRef: React.ElementRef<NativeComponentType>,
    color: string,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['changeBackgroundColor'],
});

export default (codegenNativeComponent<NativeProps>(
  'SampleNativeComponent',
): NativeComponentType);
