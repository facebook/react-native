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
const {StyleSheet, Text, View} = require('react-native');
import Platform from '../../Libraries/Utilities/Platform'; // TODO(macOS ISS#2323203)

type Props = $ReadOnly<{|
  children?: React.Node,
  title?: ?string,
  description?: ?string,
|}>;

type State = {|
  description: ?string,
|};

class RNTesterBlock extends React.Component<Props, State> {
  state = {description: null};

  render() {
    const description = this.props.description ? (
      <Text style={styles.descriptionText}>{this.props.description}</Text>
    ) : null;

    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{this.props.title}</Text>
          {description}
        </View>
        <View style={styles.children}>{this.props.children}</View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 3,
    borderWidth: 0.5,
    ...Platform.select({
      macos: {
        borderColor: {semantic: 'separatorColor'},
        backgroundColor: {semantic: 'windowBackgroundColor'},
      },
      ios: {
        borderColor: {semantic: 'separatorColor'},
        backgroundColor: {semantic: 'tertiarySystemBackgroundColor'},
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
        borderBottomColor: {semantic: 'separatorColor'},
        backgroundColor: {semantic: 'controlBackgroundColor'},
      },
      ios: {
        borderBottomColor: {semantic: 'separatorColor'},
        backgroundColor: {semantic: 'tertiarySystemBackgroundColor'},
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
        color: {semantic: 'labelColor'},
      },
      ios: {
        color: {semantic: 'labelColor'},
      },
      default: undefined,
    }),
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
  },
  children: {
    margin: 10,
  },
});

module.exports = RNTesterBlock;
