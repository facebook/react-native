/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  VibrationIOS
} = React;

exports.framework = 'React';
exports.title = 'VibrationIOS';
exports.description = 'Vibration API for iOS';
exports.examples = [{
  title: 'VibrationIOS.vibrate()',
  render() {
    return (
      <TouchableHighlight
        style={styles.wrapper}
        onPress={() => VibrationIOS.vibrate()}>
        <View style={styles.button}>
          <Text>Vibrate</Text>
        </View>
      </TouchableHighlight>
    );
  },
}];

var styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
});
