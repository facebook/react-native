'use strict';

var transformer = require('../packager/transformer.js');

function transformSource(src) {
  return transformer.transform(null, src).code;
}

module.exports = {
  transformSource: transformSource,

  process: function(src, fileName) {
    if (fileName.match(/node_modules/)) {
      return src;
    }

    try {
      return transformSource(src);
    } catch(e) {
      throw new Error('\nError transforming file:\n  js/' +
        (fileName.split('/js/')[1] || fileName) + ':' + e.lineNumber + ': \'' +
        e.message + '\'\n');
    }
  }
};
