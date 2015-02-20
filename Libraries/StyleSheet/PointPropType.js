/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule PointPropType
 */
'use strict'

var PropTypes = require('ReactPropTypes');

var createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');
var pointsDiffer = require('pointsDiffer');

var PointPropType = createStrictShapeTypeChecker({
  x: PropTypes.number,
  y: PropTypes.number,
});

PointPropType.differ = pointsDiffer;

module.exports = PointPropType;
