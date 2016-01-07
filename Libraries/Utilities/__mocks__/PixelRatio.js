/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var PixelRatio = {
  startDetecting: function () {
    // noop for our implementation
  },

  get: function() {
    return 2;
  },

  getPixelSizeForLayoutSize: function (layoutSize) {
    return Math.round(layoutSize * PixelRatio.get());
  }
};

module.exports = PixelRatio;
