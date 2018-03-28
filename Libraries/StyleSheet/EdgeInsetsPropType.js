/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule EdgeInsetsPropType
 * @flow
 */
'use strict';

const PropTypes = require('prop-types');

const createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');

const EdgeInsetsPropType = (createStrictShapeTypeChecker({
  top: PropTypes.number,
  left: PropTypes.number,
  bottom: PropTypes.number,
  right: PropTypes.number,
}): ReactPropsCheckType & ReactPropsChainableTypeChecker);

export type EdgeInsetsProp = {|
  +top: number,
  +left: number,
  +bottom: number,
  +right: number,
|};

module.exports = EdgeInsetsPropType;
