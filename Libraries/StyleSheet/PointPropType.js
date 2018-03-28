/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule PointPropType
 * @flow
 */
'use strict';

var PropTypes = require('prop-types');

var createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');

var PointPropType = createStrictShapeTypeChecker({
  x: PropTypes.number,
  y: PropTypes.number,
});

module.exports = PointPropType;
