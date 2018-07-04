/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

const PropTypes = require('prop-types');

const EdgeInsetsPropType = PropTypes.shape({
  top: PropTypes.number,
  left: PropTypes.number,
  bottom: PropTypes.number,
  right: PropTypes.number,
});

export type EdgeInsetsProp = $ReadOnly<{|
  top?: ?number,
  left?: ?number,
  bottom?: ?number,
  right?: ?number,
|}>;

module.exports = EdgeInsetsPropType;
