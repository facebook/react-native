/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
} = React;

var MAX_VALUE = 200;

function getStyleFromScore(score: number): {color: string} {
  if (score < 0) {
    return styles.noScore;
  }

  var normalizedScore = Math.round((score / 100) * MAX_VALUE);
  return {
    color: 'rgb(' +
      (MAX_VALUE - normalizedScore) + ', ' +
      normalizedScore + ', ' +
      0 +
    ')'
  };
}

var styles = StyleSheet.create({
  noScore: {
    color: '#999999',
  },
});

module.exports = getStyleFromScore;
