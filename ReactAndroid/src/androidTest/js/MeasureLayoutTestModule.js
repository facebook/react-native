/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MeasureLayoutTestModule
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var ReactNative = require('react/lib/ReactNative');
var View = require('View');
var StyleSheet = require('StyleSheet');
var UIManager = require('UIManager');

var assertEquals = require('Asserts').assertEquals;

var styles = StyleSheet.create({
  A: {
    "width": 500,
    "height": 500,
  },
  B: {
    backgroundColor: "rgb(255, 0, 0)",
    "left": 50,
    "top": 80,
    "width": 200,
    "height": 300,
  },
  C: {
    backgroundColor: "rgb(0, 255, 0)",
    "left": 100,
    "top": 70,
    "width": 50,
    "height": 150,
  },
  D: {
    backgroundColor: "rgb(0, 0, 255)",
    "left": 400,
    "top": 100,
    "width": 50,
    "height": 200,
  },
});

var A, B, C, D;

class MeasureLayoutTestApp extends React.Component {
  componentDidMount() {
    A = ReactNative.findNodeHandle(this.refs.A);
    B = ReactNative.findNodeHandle(this.refs.B);
    C = ReactNative.findNodeHandle(this.refs.C);
    D = ReactNative.findNodeHandle(this.refs.D);
  }

  render() {
    return (
      <View ref="A" style={styles.A} collapsable={false}>
        <View ref="B" style={styles.B} collapsable={false}>
          <View ref="C" style={styles.C} collapsable={false} />
        </View>
        <View ref="D" style={styles.D} collapsable={false} />
      </View>
    );
  }
}

function shouldNotCallThisCallback() {
  assertEquals(false, true);
}

var MeasureLayoutTestModule = {
  MeasureLayoutTestApp: MeasureLayoutTestApp,
  verifyMeasureOnViewA: function() {
    UIManager.measure(A, function(a, b, width, height, x, y) {
      assertEquals(500, width);
      assertEquals(500, height);
      assertEquals(0, x);
      assertEquals(0, y);
    });
  },
  verifyMeasureOnViewC: function() {
    UIManager.measure(C, function(a, b, width, height, x, y) {
      assertEquals(50, width);
      assertEquals(150, height);
      assertEquals(150, x);
      assertEquals(150, y);
    });
  },
  verifyMeasureLayoutCRelativeToA: function() {
    UIManager.measureLayout(
      C,
      A,
      shouldNotCallThisCallback,
      function (x, y, width, height) {
        assertEquals(50, width);
        assertEquals(150, height);
        assertEquals(150, x);
        assertEquals(150, y);
      });
  },
  verifyMeasureLayoutCRelativeToB: function() {
    UIManager.measureLayout(
      C,
      B,
      shouldNotCallThisCallback,
      function (x, y, width, height) {
        assertEquals(50, width);
        assertEquals(150, height);
        assertEquals(100, x);
        assertEquals(70, y);
      });
  },
  verifyMeasureLayoutCRelativeToSelf: function() {
    UIManager.measureLayout(
      C,
      C,
      shouldNotCallThisCallback,
      function (x, y, width, height) {
        assertEquals(50, width);
        assertEquals(150, height);
        assertEquals(0, x);
        assertEquals(0, y);
      });
  },
  verifyMeasureLayoutRelativeToParentOnViewA: function() {
    UIManager.measureLayoutRelativeToParent(
      A,
      shouldNotCallThisCallback,
      function (x, y, width, height) {
        assertEquals(500, width);
        assertEquals(500, height);
        assertEquals(0, x);
        assertEquals(0, y);
      });
  },
  verifyMeasureLayoutRelativeToParentOnViewB: function() {
    UIManager.measureLayoutRelativeToParent(
      B,
      shouldNotCallThisCallback,
      function (x, y, width, height) {
        assertEquals(200, width);
        assertEquals(300, height);
        assertEquals(50, x);
        assertEquals(80, y);
      });
  },
  verifyMeasureLayoutRelativeToParentOnViewC: function() {
    UIManager.measureLayoutRelativeToParent(
      C,
      shouldNotCallThisCallback,
      function (x, y, width, height) {
        assertEquals(50, width);
        assertEquals(150, height);
        assertEquals(100, x);
        assertEquals(70, y);
      });
  },
  verifyMeasureLayoutDRelativeToB: function() {
    UIManager.measureLayout(
      D,
      B,
      function () {
        assertEquals(true, true);
      },
      shouldNotCallThisCallback);
  },
  verifyMeasureLayoutNonExistentTag: function() {
    UIManager.measureLayout(
      192,
      A,
      function () {
        assertEquals(true, true);
      },
      shouldNotCallThisCallback);
  },
  verifyMeasureLayoutNonExistentAncestor: function() {
    UIManager.measureLayout(
      B,
      192,
      function () {
        assertEquals(true, true);
      },
      shouldNotCallThisCallback);
  },
  verifyMeasureLayoutRelativeToParentNonExistentTag: function() {
    UIManager.measureLayoutRelativeToParent(
      192,
      function () {
        assertEquals(true, true);
      },
      shouldNotCallThisCallback);
  },
};

BatchedBridge.registerCallableModule(
  'MeasureLayoutTestModule',
  MeasureLayoutTestModule
);

module.exports = MeasureLayoutTestModule;
