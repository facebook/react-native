/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  SliderIOS,
  Text,
  StyleSheet,
  View,
} = React;

var SliderExample = React.createClass({
  getInitialState() {
    return {
      value: 0,
    };
  },

  render() {
    return (
      <View>
        <Text style={styles.text} >
          {this.state.value}
        </Text>
        <SliderIOS
          style={styles.slider}
          onValueChange={(value) => this.setState({value: value})} />
      </View>
    );
  }
});

var styles = StyleSheet.create({
  slider: {
    height: 10,
    margin: 10,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
    margin: 10,
  },
});

exports.title = '<SliderIOS>';
exports.displayName = 'SliderExample';
exports.description = 'Slider input for numeric values';
exports.examples = [
  {
    title: 'SliderIOS',
    render(): ReactElement { return <SliderExample />; }
  }
];
