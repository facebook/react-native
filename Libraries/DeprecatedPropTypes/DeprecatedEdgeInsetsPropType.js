/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

const PropTypes = require('prop-types');

const DeprecatedEdgeInsetsPropType: React$PropType$Primitive<{
  bottom?: number,
  left?: number,
  right?: number,
  top?: number,
}> = PropTypes.shape({
  top: PropTypes.number,
  left: PropTypes.number,
  bottom: PropTypes.number,
  right: PropTypes.number,
});

module.exports = DeprecatedEdgeInsetsPropType;
