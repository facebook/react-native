/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';

import * as React from 'react';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

type Event = $ReadOnly<{
  values: $ReadOnlyArray<CodegenTypes.Int32>,
  boolValues: $ReadOnlyArray<boolean>,
  floats: $ReadOnlyArray<CodegenTypes.Float>,
  doubles: $ReadOnlyArray<CodegenTypes.Double>,
  yesNos: $ReadOnlyArray<'yep' | 'nope'>,
  strings: $ReadOnlyArray<string>,
  latLons: $ReadOnlyArray<{lat: CodegenTypes.Double, lon: CodegenTypes.Double}>,
  multiArrays: $ReadOnlyArray<$ReadOnlyArray<CodegenTypes.Int32>>,
}>;

type LegacyStyleEvent = $ReadOnly<{
  string: string,
}>;

type NativeProps = $ReadOnly<{
  ...ViewProps,
  opacity?: CodegenTypes.Float,
  values: $ReadOnlyArray<CodegenTypes.Int32>,

  // Events
  onIntArrayChanged?: ?CodegenTypes.BubblingEventHandler<Event>,
  onLegacyStyleEvent?: ?CodegenTypes.BubblingEventHandler<
    LegacyStyleEvent,
    'alternativeLegacyName',
  >,
}>;

export type MyNativeViewType = HostComponent<NativeProps>;

interface NativeCommands {
  +callNativeMethodToChangeBackgroundColor: (
    viewRef: React.ElementRef<MyNativeViewType>,
    color: string,
  ) => void;

  +callNativeMethodToAddOverlays: (
    viewRef: React.ElementRef<MyNativeViewType>,
    overlayColors: $ReadOnlyArray<string>,
  ) => void;

  +callNativeMethodToRemoveOverlays: (
    viewRef: React.ElementRef<MyNativeViewType>,
  ) => void;

  +fireLagacyStyleEvent: (viewRef: React.ElementRef<MyNativeViewType>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'callNativeMethodToChangeBackgroundColor',
    'callNativeMethodToAddOverlays',
    'callNativeMethodToRemoveOverlays',
    'fireLagacyStyleEvent',
  ],
});

export default (codegenNativeComponent<NativeProps>(
  'RNTMyNativeView',
): MyNativeViewType);
