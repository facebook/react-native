'use strict';

var keyMirror = require('keyMirror');

var VideoResizeMode = keyMirror({
  contain: null,
  cover: null,
  stretch: null,
});

module.exports = VideoResizeMode;
