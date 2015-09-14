/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule mapWithSeparator
 */
'use strict';

function mapWithSeparator(array, valueFunction, separatorFunction) {
  var results = [];
  for (var i = 0; i < array.length; i++) {
    results.push(valueFunction(array[i], i, array));
    if (i !== array.length - 1) {
      results.push(separatorFunction(i));
    }
  }
  return results;
}

module.exports = mapWithSeparator;
