'use strict';

var transformer = require('./transformer');

module.exports = function (data, callback) {
  var result;
  try {
    result = transformer.transform(
      data.transformSets,
      data.sourceCode,
      data.options
    );
  } catch (e) {
    return callback(null, {
      error: {
        lineNumber: e.lineNumber,
        column: e.column,
        message: e.message,
        stack: e.stack,
        description: e.description
      }
    });
  }

  callback(null, result);
};
