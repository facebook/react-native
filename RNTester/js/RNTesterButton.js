/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule RNTesterButton
 */
'use strict';

var React = require('react');
var PropTypes = require('prop-types');
var ReactNative = require('react-native');
var {
  StyleSheet,
  Text,
  TouchableHighlight,
} = ReactNative;

class RNTesterButton extends React.Component<{onPress?: Function}> {
  static propTypes = {
    onPress: PropTypes.func,
  };

  render() {
    return (
      <TouchableHighlight
        onPress={this.props.onPress}
        style={styles.button}
        underlayColor="grey">
        <Text>
          {
            // $FlowFixMe found when converting React.createClass to ES6
            this.props.children}
        </Text>
      </TouchableHighlight>
    );
  }
}

var styles = StyleSheet.create({
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
