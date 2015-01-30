'use strict';

var transformer = require('../packager/react-packager/src/JSTransformer/transformer.js');

function transformSource(src) {
  return transformer.transform(null, src).code;
}

module.exports = {
  transformSource: transformSource,

  process: function(src, fileName) {
    try {
      return transformSource(src);
    } catch(e) {
      throw new Error('\nError transforming file:\n  js/' +
        (fileName.split('/js/')[1] || fileName) + ':' + e.lineNumber + ': \'' +
        e.message + '\'\n');
    }
  }
};
