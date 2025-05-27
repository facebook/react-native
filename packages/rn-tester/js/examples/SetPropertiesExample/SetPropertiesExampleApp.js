/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const React = require('react');
const {Text, View} = require('react-native');

class SetPropertiesExampleApp extends React.Component<$FlowFixMeProps> {
  render(): React.Node {
    const wrapperStyle = {
      backgroundColor: this.props.color,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    };

    return (
      /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */
      <View style={wrapperStyle}>
        <Text>Embedded React Native view</Text>
      </View>
    );
  }
}

module.exports = SetPropertiesExampleApp;
