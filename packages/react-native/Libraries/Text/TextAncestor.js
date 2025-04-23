/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const React = require('react');

/**
 * Whether the current element is the descendant of a <Text> element.
 */
const TextAncestorContext: React.Context<boolean> = React.createContext(false);
if (__DEV__) {
  TextAncestorContext.displayName = 'TextAncestorContext';
}
export default TextAncestorContext;
