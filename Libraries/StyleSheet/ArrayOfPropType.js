/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ArrayOfPropType
 */
'use strict'

var ReactPropTypes = require('ReactPropTypes');

var deepDiffer = require('deepDiffer');

var ArrayOfPropType = (type, differ) => {
  var checker = ReactPropTypes.arrayOf(type);
  checker.differ = differ ? differ : deepDiffer;
  return checker;
};

module.exports = ArrayOfPropType;
