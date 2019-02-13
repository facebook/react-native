/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const React = require('React');

/**
 * Whether the current element is the descendant of a <Text> element.
 */
/* $FlowFixMe(>=0.85.0 site=react_native_fb) This comment suppresses an error
 * found when Flow v0.85 was deployed. To see the error, delete this comment
 * and run Flow. */
module.exports = React.createContext(false);
