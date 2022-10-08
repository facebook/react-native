/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {
  BubblingEventHandler,
  Float,
  WithDefault,
} from '../../Types/CodegenTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import * as React from 'react';

type Event = $ReadOnly<{|
  timestamp: Float,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  date?: ?Float,
  initialDate?: ?Float,
  locale?: ?string,
  maximumDate?: ?Float,
  minimumDate?: ?Float,
  minuteInterval?: WithDefault<
    1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30,
    1,
  >,
  mode?: WithDefault<'date' | 'time' | 'datetime', 'date'>,
  onChange?: ?BubblingEventHandler<Event>,
  timeZoneOffsetInMinutes?: ?Float,
  pickerStyle?: WithDefault<'compact' | 'spinner' | 'inline', 'spinner'>,
|}>;

type ComponentType = HostComponent<NativeProps>;

interface NativeCommands {
  +setNativeDate: (
    viewRef: React.ElementRef<ComponentType>,
    date: Float,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeDate'],
});

export default (codegenNativeComponent<NativeProps>('DatePicker', {
  paperComponentName: 'RCTDatePicker',
  excludedPlatforms: ['android'],
}): HostComponent<NativeProps>);
