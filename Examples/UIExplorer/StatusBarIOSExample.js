/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule StatusBarIOSExample
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  StatusBarIOS,
} = React;

exports.framework = 'React';
exports.title = 'StatusBarIOS';
exports.description = 'Module for controlling iOS status bar';
exports.examples = [{
  title: 'Status Bar Style',
  render() {
    return (
      <View>
        {Object.keys(StatusBarIOS.Style).map((key) =>
          <TouchableHighlight style={styles.wrapper}
            onPress={() => StatusBarIOS.setStyle(StatusBarIOS.Style[key])}>
            <View style={styles.button}>
              <Text>setStyle(StatusBarIOS.Style.{key})</Text>
            </View>
          </TouchableHighlight>
        )}
      </View>
    );
  },
}, {
  title: 'Status Bar Style Animated',
  render() {
    return (
      <View>
        {Object.keys(StatusBarIOS.Style).map((key) =>
          <TouchableHighlight style={styles.wrapper}
            onPress={() => StatusBarIOS.setStyle(StatusBarIOS.Style[key], true)}>
            <View style={styles.button}>
              <Text>setStyle(StatusBarIOS.Style.{key}, true)</Text>
            </View>
          </TouchableHighlight>
        )}
      </View>
    );
  },
}, {
  title: 'Status Bar Hidden',
  render() {
    return (
      <View>
        {Object.keys(StatusBarIOS.Animation).map((key) =>
          <View>
            <TouchableHighlight style={styles.wrapper}
              onPress={() => StatusBarIOS.setHidden(true, StatusBarIOS.Animation[key])}>
              <View style={styles.button}>
                <Text>setHidden(true, StatusBarIOS.Animation.{key})</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={styles.wrapper}
              onPress={() => StatusBarIOS.setHidden(false, StatusBarIOS.Animation[key])}>
              <View style={styles.button}>
                <Text>setHidden(false, StatusBarIOS.Animation.{key})</Text>
              </View>
            </TouchableHighlight>
          </View>
        )}
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
