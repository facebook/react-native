/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('react-native');
var {
  Slider,
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
        <Slider
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

exports.title = '<Slider>';
exports.description = 'Slider input for numeric values';
exports.examples = [
  {
    title: 'Slider',
    render() { return <SliderExample />; }
  }
];
