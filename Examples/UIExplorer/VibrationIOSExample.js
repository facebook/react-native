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
} = React;

exports.framework = 'React';
exports.title = 'Vibration';
exports.description = 'Vibration API for iOS';
exports.examples = [{
  title: 'navigator.vibrate()',
  render() {
    return (
      <View>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => navigator.vibrate()}>
          <View style={styles.button}>
            <Text>Vibrate</Text>
          </View>
        </TouchableHighlight>
      </View>
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
