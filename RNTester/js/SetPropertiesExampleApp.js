/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

class SetPropertiesExampleApp extends React.Component<$FlowFixMeProps> {

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
