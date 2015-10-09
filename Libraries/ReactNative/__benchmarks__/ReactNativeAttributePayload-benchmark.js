/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactNativeAttributePayload-benchmark
 */
'use strict';

var StyleSheet = require('StyleSheet');

// Various example props

var small1 = {
  accessible: true,
  accessibilityLabel: 'Hello',
  collapsable: true,
};

var small2 = {
  accessible: true,
  accessibilityLabel: 'Hello 2',
  collapsable: false,
  needsOffscreenAlphaCompositing: true,
};

var small3 = {
  accessible: true,
  accessibilityLabel: 'Hello 2',
};

var medium1 = {
  ...small1,
  onLayout: function() {},
  onAccessibilityTap: true,
  onMagicTap: function() {},
  collapsable: true,
  needsOffscreenAlphaCompositing: true,
  style: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)'
  }
};

var medium2 = {
  ...small2,
  onLayout: function() {},
  onAccessibilityTap: true,
  onMagicTap: function() {},
  collapsable: true,
  needsOffscreenAlphaCompositing: true,
  style: {
    backgroundColor: 'rgba(128, 0, 0, 1)',
    color: [128, 0, 0],
    shadowColor: 56,
    textDecorationColor: 34,
    tintColor: 45,

    transform: [
      {perspective: 5},
      {scale: 5},
      {scaleX: 10},
      {scaleY: 10},
      {translateX: 2},
      {translateY: 5}
    ],
  }
};

var medium3 = {
  ...small3,
  onAccessibilityTap: true,
  onMagicTap: function() {},
  needsOffscreenAlphaCompositing: true,
  style: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    color: [128, 0, 0],
    shadowColor: 56,
    textDecorationColor: 34,
    tintColor: 45,

    transform: [
      {perspective: 5},
      {scale: 5},
      {scaleX: 12},
      {scaleY: 16},
      {translateX: 10},
      {translateY: 5}
    ],
  }
};

var style1 = {

  backgroundColor: 'rgba(10,0,0,1)',
  borderColor: 'rgba(10,0,0,1)',
  color: [255, 0, 0],
  shadowColor: 54,
  textDecorationColor: 34,
  tintColor: 45,

  transform: [
    {perspective: 5},
    {scale: 5},
    {scaleX: 2},
    {scaleY: 3},
    {translateX: 2},
    {translateY: 3}
  ],

};

var style1b = {

  backgroundColor: 'rgba(10,0,0,1)',
  borderColor: 'rgba(10,0,0,1)',
  color: [128, 0, 0],
  shadowColor: 56,
  textDecorationColor: 34,
  tintColor: 45,

  transform: [
    {perspective: 5},
    {scale: 5},
    {scaleX: 10},
    {scaleY: 10},
    {translateX: 2},
    {translateY: 5}
  ],

};

var style2 = {

  shadowOffset: { width: 10, height: 15 },

  resizeMode: 'contain', // 'cover'
  overflow: 'visible', // 'hidden'

  opacity: 0.5,

  width: 123,
  height: 43,
  top: 13,
  left: 43,
  right: 12,
  bottom: 123,
  margin: 13,
  padding: 53,
  paddingRight: 523,
  borderWidth: 63,
  borderRadius: 123,
};

var style3 = {
  position: 'absolute', // 'relative'
  flexDirection: 'row', // 'column'
  flexWrap: 'wrap', // 'nowrap'
  justifyContent: 'flex-start', // 'flex-end'
  alignItems: 'center',
  alignSelf: 'auto',
  flex: 0,
};

var style3b = {
  position: 'relative',
  flexDirection: 'column',
  flexWrap: 'nowrap',
  justifyContent: 'flex-end',
};

var { regStyle2, regStyle3 } = StyleSheet.create({
  regStyle2: style2,
  regStyle3: style3
});

var large1 = {
  ...medium1,
  style: {
    ...medium1.style,
    ...style1,
    ...style2,
    ...style3
  }
};

var large2 = {
  ...medium2,
  style: [
    [regStyle2, style1],
    regStyle3
  ]
};

var large3 = {
  ...medium3,
  style: [
    [regStyle2, style1b],
    style3
  ]
};

var large4 = {
  ...medium3,
  style: [
    [regStyle2, style1b],
    style3b
  ]
};

// Clones, to test

var clone = function (obj) {
  var str = JSON.stringify(obj, function(k, v) {
    return typeof v === 'function' ? 'FUNCTION' : v;
  });
  return JSON.parse(str, function(k, v) {
    return v === 'FUNCTION' ? function() {} : v;
  });
};

var small4 = clone(small3);
var medium4 = clone(medium3);
var large5 = clone(large4);

// Test combinations

var variants = {
  s1: small1,
  s2: small2,
  s3: small3,
  s4: small4,
  m1: medium1,
  m2: medium2,
  m3: medium3,
  m4: medium4,
  l1: large1,
  l2: large2,
  l3: large3,
  l4: large4,
  l5: large5,
};

var commonCases = [
  // Reference equality
  'l1l1',
  // Equal but not reference equal
  's3s4',
  'm3m4',
  'l4l5',
  // Complex base style with a small change in the end
  'l3l4',
  'l4l3',
];

// Differ

var validAttributes = require('ReactNativeViewAttributes').UIView;

var Differ = require('ReactNativeAttributePayload');

// Runner

var numberOfBenchmarks = 0;
var totalTimeForAllBenchmarks = 0;
var numberOfCommonCases = 0;
var totalTimeForAllCommonCases = 0;
var results = {};

function runBenchmarkOnce(value1, value2) {
  // Warm up the differ. This is needed if the differ uses state to store the
  // previous values.
  Differ.diff({}, value1, validAttributes);
  var cache = Differ.previousFlattenedStyle;
  var start = Date.now();
  for (var i = 0; i < 1000; i++) {
    Differ.diff(value1, value2, validAttributes);
    Differ.previousFlattenedStyle = cache;
  }
  var end = Date.now();
  return (end - start);
}

function runBenchmark(key1, key2, value1, value2) {
  if (results.hasOwnProperty(key1 + key2)) {
    // dedupe same test that runs twice. E.g. key1 === key2
    return;
  }
  var totalTime = 0;
  var nthRuns = 5;
  for (var i = 0; i < nthRuns; i++) {
    totalTime += runBenchmarkOnce(value1, value2);
  }
  var runTime = totalTime / nthRuns;
  results[key1 + key2] = runTime;
  totalTimeForAllBenchmarks += runTime;
  numberOfBenchmarks++;
  if (commonCases.indexOf(key1 + key2) > -1) {
    numberOfCommonCases++;
    totalTimeForAllCommonCases += runTime;
  }
}

function runAllCombinations() {
  for (var outerKey in variants) {
    for (var innerKey in variants) {
      if (variants.hasOwnProperty(outerKey) &&
          variants.hasOwnProperty(innerKey)) {
        runBenchmark(
          outerKey,
          innerKey,
          variants[outerKey],
          variants[innerKey]
        );
      }
    }
  }
}

function formatResult() {
  var str =
    'Average runtime: ' +
    (totalTimeForAllBenchmarks / numberOfBenchmarks) +
    ' units\n';

  var worstCase = 0;
  for (var key in results) {
    if (results[key] > worstCase) {
      worstCase = results[key];
    }
  }

  str += 'Common cases: ' +
          (totalTimeForAllCommonCases / numberOfCommonCases) +
          ' units\n';

  str += 'Worst case: ' + worstCase + ' units\n';

  str += 'Per combination:\n';
  for (var key in results) {
    str += key + ':\u00A0' + results[key] + ', ';
  }
  return str;
}

runAllCombinations();

module.exports = formatResult();
