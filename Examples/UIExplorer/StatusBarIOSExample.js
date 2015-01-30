/**
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
        {Object.keys(StatusBarIOS.style).map((key) =>
          <TouchableHighlight style={styles.wrapper}
            onPress={() => StatusBarIOS.setStyle(StatusBarIOS.style[key])}>
            <View style={styles.button}>
              <Text>setStyle(StatusBarIOS.style.{key})</Text>
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
        {Object.keys(StatusBarIOS.style).map((key) =>
          <TouchableHighlight style={styles.wrapper}
            onPress={() => StatusBarIOS.setStyle(StatusBarIOS.style[key], true)}>
            <View style={styles.button}>
              <Text>setStyle(StatusBarIOS.style.{key}, true)</Text>
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
        {Object.keys(StatusBarIOS.animation).map((key) =>
          <View>
            <TouchableHighlight style={styles.wrapper}
              onPress={() => StatusBarIOS.setHidden(true, StatusBarIOS.animation[key])}>
              <View style={styles.button}>
                <Text>setHidden(true, StatusBarIOS.animation.{key})</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={styles.wrapper}
              onPress={() => StatusBarIOS.setHidden(false, StatusBarIOS.animation[key])}>
              <View style={styles.button}>
                <Text>setHidden(false, StatusBarIOS.animation.{key})</Text>
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

