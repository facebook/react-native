/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import * as React from 'react';

type Value = {horizontal: boolean} | null;

const ScrollViewContext: React.Context<Value> = React.createContext(null);
if (__DEV__) {
  ScrollViewContext.displayName = 'ScrollViewContext';
}
export default ScrollViewContext;

export const HORIZONTAL: Value = Object.freeze({horizontal: true});
export const VERTICAL: Value = Object.freeze({horizontal: false});
