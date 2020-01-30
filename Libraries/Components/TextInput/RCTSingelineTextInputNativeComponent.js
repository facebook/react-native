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

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import requireNativeComponent from '../../ReactNative/requireNativeComponent';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import type {Int32} from '../../Types/CodegenTypes';
import * as React from 'react';
import RCTSinglelineTextInputViewConfig from './RCTSinglelineTextInputViewConfig';
const ReactNativeViewConfigRegistry = require('../../Renderer/shims/ReactNativeViewConfigRegistry');

type NativeType = HostComponent<mixed>;

interface NativeCommands {
  +focus: (viewRef: React.ElementRef<NativeType>) => void;
  +blur: (viewRef: React.ElementRef<NativeType>) => void;
  +setMostRecentEventCount: (
    viewRef: React.ElementRef<NativeType>,
    eventCount: Int32,
  ) => void;
  +setTextAndSelection: (
    viewRef: React.ElementRef<NativeType>,
    mostRecentEventCount: Int32,
    value: ?string, // in theory this is nullable
    start: Int32,
    end: Int32,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'focus',
    'blur',
    'setMostRecentEventCount',
    'setTextAndSelection',
  ],
});

let SinglelineTextInputNativeComponent;
if (global.RN$Bridgeless) {
  ReactNativeViewConfigRegistry.register('RCTSinglelineTextInputView', () => {
    return RCTSinglelineTextInputViewConfig;
  });
  SinglelineTextInputNativeComponent = 'RCTSinglelineTextInputView';
} else {
  SinglelineTextInputNativeComponent = requireNativeComponent<mixed>(
    'RCTSinglelineTextInputView',
  );
}

// flowlint-next-line unclear-type:off
export default ((SinglelineTextInputNativeComponent: any): HostComponent<mixed>);
