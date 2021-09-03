/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';

import type {Int32} from '../../Types/CodegenTypes';

export interface TextInputNativeCommands<T> {
  +focus: (viewRef: React.ElementRef<T>) => void;
  +blur: (viewRef: React.ElementRef<T>) => void;
  +setTextAndSelection: (
    viewRef: React.ElementRef<T>,
    mostRecentEventCount: Int32,
    value: ?string, // in theory this is nullable
    start: Int32,
    end: Int32,
  ) => void;
}

const supportedCommands = ['focus', 'blur', 'setTextAndSelection'];

export default supportedCommands;
