/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {Text, View, TouchableOpacity} = ReactNative;

class TransparentHitTestExample extends React.Component<{}> {
  render() {
    return (
      <View style={{flex: 1}}>
        <TouchableOpacity onPress={() => alert('Hi!')}>
          <Text>HELLO!</Text>
        </TouchableOpacity>

        <View
          style={{
            position: 'absolute',
            backgroundColor: 'green',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            opacity: 0.0,
          }}
        />
      </View>
    );
  }
}

exports.title = '<TransparentHitTestExample>';
exports.displayName = 'TransparentHitTestExample';
exports.description = 'Transparent view receiving touch events';
exports.examples = [
  {
    title: 'TransparentHitTestExample',
    render(): React.Element<any> {
      return <TransparentHitTestExample />;
    },
  },
];
