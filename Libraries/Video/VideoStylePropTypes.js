'use strict';

var VideoResizeMode = require('./VideoResizeMode');
var LayoutPropTypes = require('LayoutPropTypes');
var ReactPropTypes = require('ReactPropTypes');

var VideoStylePropTypes = {
  ...LayoutPropTypes,
  resizeMode: ReactPropTypes.oneOf(Object.keys(VideoResizeMode)),
};

module.exports = VideoStylePropTypes;
