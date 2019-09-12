/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('react');

const {StyleSheet, Text, View} = require('react-native');
import {RNTesterThemeContext} from './RNTesterTheme';

class RNTesterTitle extends React.Component<$FlowFixMeProps> {
  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <View
              style={[
                styles.container,
                {
                  borderColor: theme.SeparatorColor,
                  backgroundColor: theme.SystemBackgroundColor,
                },
              ]}>
              <Text style={[styles.text, {color: theme.LabelColor}]}>
                {this.props.title}
              </Text>
            </View>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    borderWidth: 0.5,
    margin: 10,
    marginBottom: 0,
    height: 45,
    padding: 10,
  },
  text: {
    fontSize: 19,
    fontWeight: '500',
  },
});

module.exports = RNTesterTitle;
