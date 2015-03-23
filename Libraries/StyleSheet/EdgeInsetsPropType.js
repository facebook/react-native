/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule EdgeInsetsPropType
 */
'use strict'

var PropTypes = require('ReactPropTypes');

var createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');
var insetsDiffer = require('insetsDiffer');

var EdgeInsetsPropType = createStrictShapeTypeChecker({
  top: PropTypes.number,
  left: PropTypes.number,
  bottom: PropTypes.number,
  right: PropTypes.number,
});

module.exports = EdgeInsetsPropType;
