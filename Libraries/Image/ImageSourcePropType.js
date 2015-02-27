/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ImageSourcePropType
 * @flow
 */
'use strict';

var { PropTypes } = require('React');

var ImageSourcePropType = PropTypes.shape({
  /**
   * uri - A string representing the resource identifier for the image, which
   * could be an http address, a local file path, or the name of a static image
   * resource (which should be wrapped in the `ix` function).
   */
  uri: PropTypes.string.isRequired,
  /**
   * width/height - Used to store the size of the image itself, but unused by
   * the <Image> component - use normal style layout properties to define the
   * size of the frame.
   */
  width: PropTypes.number,
  height: PropTypes.number,
});

module.exports = ImageSourcePropType;
