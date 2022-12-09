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
 * Used to retrieve parent view accessibilityLiveRegion
 */
const ViewAncestorContext = (React.createContext(
  false,
): React$Context<$FlowFixMe>);
if (__DEV__) {
  ViewAncestorContext.displayName = 'ViewAncestorContext';
}
module.exports = ViewAncestorContext;
