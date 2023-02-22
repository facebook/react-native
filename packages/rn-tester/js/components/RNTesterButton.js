/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('react');

const {StyleSheet, Text, TouchableHighlight} = require('react-native');

import type {PressEvent} from 'react-native/Libraries/Types/CoreEventTypes';

type Props = $ReadOnly<{|
  testID?: string,
  textTestID?: string,
  children?: React.Node,
  onPress?: ?(event: PressEvent) => mixed,
|}>;

class RNTesterButton extends React.Component<Props> {
  render(): React.Node {
    return (
      <TouchableHighlight
        testID={this.props.testID}
        onPress={this.props.onPress}
        style={styles.button}
        underlayColor="grey">
        <Text testID={this.props.textTestID}>{this.props.children}</Text>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    borderColor: '#696969',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d3d3d3',
  },
});

module.exports = RNTesterButton;
