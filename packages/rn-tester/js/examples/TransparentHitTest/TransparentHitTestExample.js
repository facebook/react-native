/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const {Text, View, TouchableOpacity, Alert} = require('react-native');

class TransparentHitTestExample extends React.Component<{...}> {
  render(): React.Node {
    return (
      <View style={{flex: 1}}>
        <TouchableOpacity onPress={() => Alert.alert('Alert', 'Hi!')}>
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

exports.title = 'TransparentHitTestExample';
exports.category = 'UI';
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
