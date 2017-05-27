/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule SetPropertiesExampleApp
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  Text,
  View,
} = ReactNative;

class SetPropertiesExampleApp extends React.Component {

  render() {
    const wrapperStyle = {
      backgroundColor: this.props.color,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    };

    return (
      <View style={wrapperStyle}>
        <Text>
          Embedded React Native view
        </Text>
      </View>
    );
  }

}

module.exports = SetPropertiesExampleApp;
