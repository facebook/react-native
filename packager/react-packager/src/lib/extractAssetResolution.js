'use strict';

var path = require('path');

function extractAssetResolution(filename) {
  var ext = path.extname(filename);

  var re = new RegExp('@([\\d\\.]+)x\\' + ext + '$');

  var match = filename.match(re);
  var resolution;

  if (!(match && match[1])) {
    resolution = 1;
  } else {
    resolution = parseFloat(match[1], 10);
    if (isNaN(resolution)) {
      resolution = 1;
    }
  }

  return {
    resolution: resolution,
    assetName: match ? filename.replace(re, ext) : filename,
  };
}

module.exports = extractAssetResolution;
