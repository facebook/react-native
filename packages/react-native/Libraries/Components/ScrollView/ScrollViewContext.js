/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import * as React from 'react';
import {createContext} from 'react';

type Value = {horizontal: boolean} | null;

const ScrollViewContext: React.Context<Value> = createContext(null);
if (__DEV__) {
  ScrollViewContext.displayName = 'ScrollViewContext';
}
export default ScrollViewContext;

// $FlowFixMe[incompatible-type] frozen objects are readonly
export const HORIZONTAL: Value = Object.freeze({horizontal: true});
// $FlowFixMe[incompatible-type] frozen objects are readonly
export const VERTICAL: Value = Object.freeze({horizontal: false});
