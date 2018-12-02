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
const View = require('View');
const StyleSheet = require('StyleSheet');

const RecordingModule = require('NativeModules').Recording;

const LAYOUT_SPECS = [
  [10, 10, 100, 100],
  [10, 10, 50, 50],
  [0, 0, 50, 50],
  [0, 0, 50, 50],
];

class LayoutEventsTestApp extends React.Component {
  constructor() {
    super();
    this.state = {
      specNumber: 0,
    };
    this.numParentLayouts = 0;
  }

  handleOnLayout = e => {
    const layout = e.nativeEvent.layout;
    RecordingModule.record(
      layout.x + ',' + layout.y + '-' + layout.width + 'x' + layout.height,
    );

    if (this.state.specNumber >= LAYOUT_SPECS.length) {
      // This will cause the test to fail
      RecordingModule.record('Got an extraneous layout call');
    } else {
      this.setState({
        specNumber: this.state.specNumber + 1,
      });
    }
  };

  handleParentOnLayout = e => {
    if (this.numParentLayouts > 0) {
      // This will cause the test to fail - the parent's layout doesn't change
      // so we should only get the event once.
      RecordingModule.record('Got an extraneous layout call on the parent');
    }
    this.numParentLayouts++;
  };

  render() {
    const layout = LAYOUT_SPECS[this.state.specNumber];
    return (
      <View
        onLayout={this.handleParentOnLayout}
        testID="parent"
        style={styles.container}>
        <View
          onLayout={this.handleOnLayout}
          testID="container"
          style={{
            left: layout[0],
            top: layout[1],
            width: layout[2],
            height: layout[3],
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    left: 0,
    top: 0,
    width: 500,
    height: 500,
  },
});

module.exports = LayoutEventsTestApp;
