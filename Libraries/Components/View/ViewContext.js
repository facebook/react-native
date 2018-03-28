/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ViewContext
 * @flow
 * @format
 */
'use strict';

const PropTypes = require('prop-types');

export type ViewChildContext = {|
  +isInAParentText: boolean,
|};

export const ViewContextTypes = {
  isInAParentText: PropTypes.bool,
};
