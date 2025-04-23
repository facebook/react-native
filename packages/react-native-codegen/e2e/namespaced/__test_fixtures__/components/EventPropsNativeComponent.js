/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type OnChangeEvent = $ReadOnly<{
  value: boolean,
  source?: string,
  progress: ?CodegenTypes.Int32,
  scale?: ?CodegenTypes.Float,
}>;

type OnEventDirect = $ReadOnly<{
  value: boolean,
}>;

type OnOrientationChangeEvent = $ReadOnly<{
  orientation: 'landscape' | 'portrait',
}>;

type NativeProps = $ReadOnly<{
  ...ViewProps,

  // Props
  disabled?: CodegenTypes.WithDefault<boolean, false>,

  // Events
  onChange?: ?CodegenTypes.BubblingEventHandler<
    OnChangeEvent,
    'paperDirectName',
  >,
  onEventDirect?: ?CodegenTypes.DirectEventHandler<OnEventDirect>,
  onEventDirectWithPaperName?: ?CodegenTypes.DirectEventHandler<
    OnEventDirect,
    'paperDirectName',
  >,
  onOrientationChange?: ?CodegenTypes.DirectEventHandler<
    OnOrientationChangeEvent,
    'paperBubblingName',
  >,
  onEnd?: ?CodegenTypes.BubblingEventHandler<null>,
  onEventBubblingWithPaperName?: ?CodegenTypes.BubblingEventHandler<
    null,
    'paperBubblingName',
  >,
}>;

export default (codegenNativeComponent<NativeProps>(
  'EventPropsNativeComponentView',
): HostComponent<NativeProps>);
