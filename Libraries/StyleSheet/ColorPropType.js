'use strict';
var ReactPropTypes = require('ReactPropTypes');
var tinycolor = require('tinycolor');

var colorValidator = function (selectedColor, propName) {
  if (selectedColor === null || selectedColor === undefined || selectedColor.toString().trim() === '') {
    return new Error(
      `Invalid argument supplied to ${propName}.Expected a string like #123ADF or 'red'.`
    );
  }

  if (tinycolor(selectedColor.toString().trim()).isValid()) {
    return null;
  }

  return new Error(
    `Invalid argument supplied to ${propName}.Expected a string like #123ADF or 'red'.`
  );
};

var ColorPropType = ReactPropTypes.oneOfType([colorValidator]);

module.exports = ColorPropType;
