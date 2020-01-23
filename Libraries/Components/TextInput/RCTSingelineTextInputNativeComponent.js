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

const SinglelineTextInputNativeComponent: HostComponent<mixed> = requireNativeComponent<mixed>(
  'RCTSinglelineTextInputView',
);

export default SinglelineTextInputNativeComponent;
