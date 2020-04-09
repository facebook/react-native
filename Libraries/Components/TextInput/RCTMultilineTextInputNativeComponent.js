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
import type {TextInputNativeCommands} from './TextInputNativeCommands';
import * as React from 'react';

type NativeType = HostComponent<mixed>;

type NativeCommands = TextInputNativeCommands<NativeType>;

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'focus',
    'blur',
    'setMostRecentEventCount',
    'setTextAndSelection',
  ],
});

const SinglelineTextInputNativeComponent: HostComponent<mixed> = requireNativeComponent<mixed>(
  'RCTMultilineTextInputView',
);

export default SinglelineTextInputNativeComponent;
