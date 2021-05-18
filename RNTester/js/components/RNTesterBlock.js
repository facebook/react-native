/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const {PlatformColor, StyleSheet, Text, View} = require('react-native');
import {Platform} from 'react-native'; // TODO(macOS GH#774)
import {RNTesterThemeContext} from './RNTesterTheme';

type Props = $ReadOnly<{|
  children?: React.Node,
  title?: ?string,
  description?: ?string,
|}>;

type State = {|
  description: ?string,
|};

class RNTesterBlock extends React.Component<Props, State> {
  state: State = {description: null};

  render(): React.Node {
    const description = this.props.description ? (
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <Text style={[styles.descriptionText, {color: theme.LabelColor}]}>
              {this.props.description}
            </Text>
          );
        }}
      </RNTesterThemeContext.Consumer>
    ) : null;

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
              <View
                style={[
                  styles.titleContainer,
                  {
                    borderBottomColor: theme.SeparatorColor,
                    backgroundColor: theme.QuaternarySystemFillColor,
                  },
                ]}>
                <Text style={[styles.titleText, {color: theme.LabelColor}]}>
                  {this.props.title}
                </Text>
                {description}
              </View>
              <View style={styles.children}>{this.props.children}</View>
            </View>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 3,
    borderWidth: 0.5,
    ...Platform.select({
      macos: {
        borderColor: PlatformColor('separatorColor'),
        backgroundColor: PlatformColor('windowBackgroundColor'),
      },
      ios: {
        borderColor: PlatformColor('separatorColor'),
        backgroundColor: PlatformColor('tertiarySystemBackgroundColor'),
      },
      default: {
        borderColor: '#d6d7da',
        backgroundColor: '#ffffff',
      },
    }),
    margin: 10,
    marginVertical: 5,
    overflow: 'hidden',
  },
  titleContainer: {
    borderBottomWidth: 0.5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 2.5,
    ...Platform.select({
      macos: {
        borderBottomColor: PlatformColor('separatorColor'),
        backgroundColor: PlatformColor('controlBackgroundColor'),
      },
      ios: {
        borderBottomColor: PlatformColor('separatorColor'),
        backgroundColor: PlatformColor('tertiarySystemBackgroundColor'),
      },
      default: {
        borderBottomColor: '#d6d7da',
        backgroundColor: '#f6f7f8',
      },
    }),
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  titleText: {
    ...Platform.select({
      macos: {
        color: PlatformColor('labelColor'),
      },
      ios: {
        color: PlatformColor('labelColor'),
      },
      default: undefined,
    }),
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    ...Platform.select({
      macos: {
        color: PlatformColor('secondaryLabelColor'),
      },
      ios: {
        color: PlatformColor('secondaryLabelColor'),
      },
      default: undefined,
    }),
  },
  children: {
    margin: 10,
  },
});

module.exports = RNTesterBlock;
