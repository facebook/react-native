/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MultitouchHandlingTestAppModule
 */

'use strict';

var React = require('React');
var Recording = require('NativeModules').Recording;
var StyleSheet = require('StyleSheet');
var TouchEventUtils = require('fbjs/lib/TouchEventUtils');
var View = require('View');

class TouchTestApp extends React.Component {
  handleStartShouldSetResponder = (e) => {
    return true;
  };

  handleOnResponderMove = (e) => {
    e = TouchEventUtils.extractSingleTouch(e.nativeEvent);
    Recording.record('move;' + e.touches.length);
  };

  handleResponderStart = (e) => {
    e = TouchEventUtils.extractSingleTouch(e.nativeEvent);
    if (e.touches) {
      Recording.record('start;' + e.touches.length);
    } else {
      Recording.record('start;ExtraPointer');
    }
  };

  handleResponderEnd = (e) => {
    e = TouchEventUtils.extractSingleTouch(e.nativeEvent);
    if (e.touches) {
      Recording.record('end;' + e.touches.length);
    } else {
      Recording.record('end;ExtraPointer');
    }
  };

  render() {
    return (
      <View
        style={styles.container}
        onStartShouldSetResponder={this.handleStartShouldSetResponder}
        onResponderMove={this.handleOnResponderMove}
        onResponderStart={this.handleResponderStart}
        onResponderEnd={this.handleResponderEnd}
        collapsable={false}
      />
    );
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

module.exports = TouchTestApp;
