/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  AlertIOS,
} = React;

exports.framework = 'React';
exports.title = 'AlertIOS';
exports.description = 'iOS alerts and action sheets';
exports.examples = [{
  title: 'Alerts',
  render() {
    return (
      <View>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Foo Title',
            'My Alert Msg'
          )}>
          <View style={styles.button}>
            <Text>Alert with message and default button</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            null,
            null,
            [
              {text: 'Button', onPress: () => console.log('Button Pressed!')},
            ]
          )}>
          <View style={styles.button}>
            <Text>Alert with only one button</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Foo Title',
            'My Alert Msg',
            [
              {text: 'Foo', onPress: () => console.log('Foo Pressed!')},
              {text: 'Bar', onPress: () => console.log('Bar Pressed!')},
            ]
          )}>
          <View style={styles.button}>
            <Text>Alert with two buttons</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Foo Title',
            null,
            [
              {text: 'Foo', onPress: () => console.log('Foo Pressed!')},
              {text: 'Bar', onPress: () => console.log('Bar Pressed!')},
              {text: 'Baz', onPress: () => console.log('Baz Pressed!')},
            ]
          )}>
          <View style={styles.button}>
            <Text>Alert with 3 buttons</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Foo Title',
            'My Alert Msg',
            '..............'.split('').map((dot, index) => ({
              text: 'Button ' + index,
              onPress: () => console.log('Pressed ' + index)
            }))
          )}>
          <View style={styles.button}>
            <Text>Alert with too many buttons</Text>
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
