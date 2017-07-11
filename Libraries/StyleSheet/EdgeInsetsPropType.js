/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EdgeInsetsPropType
 * @flow
 */
'use strict';

var PropTypes = require('prop-types');

var createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');

var EdgeInsetsPropType = createStrictShapeTypeChecker({
  top: PropTypes.number,
  left: PropTypes.number,
  bottom: PropTypes.number,
  right: PropTypes.number,
});

export type EdgeInsetsProp = {
  top: number,
  left: number,
  bottom: number,
  right: number,
};

module.exports = EdgeInsetsPropType;
