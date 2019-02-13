/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('React');
const Recording = require('NativeModules').Recording;
const StyleSheet = require('StyleSheet');
const View = require('View');

const extractSingleTouch = nativeEvent => {
  const touches = nativeEvent.touches;
  const changedTouches = nativeEvent.changedTouches;
  const hasTouches = touches && touches.length > 0;
  const hasChangedTouches = changedTouches && changedTouches.length > 0;

  return !hasTouches && hasChangedTouches
    ? changedTouches[0]
    : hasTouches
      ? touches[0]
      : nativeEvent;
};

class TouchTestApp extends React.Component {
  handleStartShouldSetResponder = e => {
    return true;
  };

  handleOnResponderMove = e => {
    e = extractSingleTouch(e.nativeEvent);
    Recording.record('move;' + e.touches.length);
  };

  handleResponderStart = e => {
    e = extractSingleTouch(e.nativeEvent);
    if (e.touches) {
      Recording.record('start;' + e.touches.length);
    } else {
      Recording.record('start;ExtraPointer');
    }
  };

  handleResponderEnd = e => {
    e = extractSingleTouch(e.nativeEvent);
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

module.exports = TouchTestApp;
