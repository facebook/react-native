/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule LocaleExampleAndroid
 */
'use strict';


var React = require('react');
var ReactNative = require('react-native');
var {
  LocaleAndroid,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = ReactNative;

exports.framework = 'React';
exports.title = 'LocaleAndroid';
exports.description = 'Device locale';

exports.examples = [
  {
    title: 'getAsync',
    render: function(): React.Element<any> {
      return <LocaleExampleAndroid />;
    },
  }
];

class LocaleExampleAndroid extends React.Component {
  state = {
    locale: 'unknown',
  };

  render() {
    return (
      <View>
        <Text>{this.state.locale}</Text>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => {
            LocaleAndroid.getAsync().then(locale => {
              this.setState({locale});
            });
          }}>
          <View style={styles.button}>
            <Text>Get locale</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginVertical: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
});
