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

const {Clipboard, View, Text, StyleSheet} = require('react-native');

type Props = $ReadOnly<{||}>;
type State = {|
  content: string,
|};

class ClipboardExample extends React.Component<Props, State> {
  state = {
    content: 'Content will appear here',
  };

  _setClipboardContent = async () => {
    Clipboard.setString('Hello World');
    try {
      const content = await Clipboard.getString();
      this.setState({content});
    } catch (e) {
      this.setState({content: e.message});
    }
  };

  render() {
    return (
      <View>
        <Text onPress={this._setClipboardContent} style={styles.label}>
          Tap to put "Hello World" in the clipboard
        </Text>
        <Text style={styles.content}>{this.state.content}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  label: {
    color: 'blue',
  },
  content: {
    color: 'red',
    marginTop: 20,
  },
});

exports.title = 'Clipboard';
exports.description = 'Show Clipboard contents.';
exports.examples = [
  {
    title: 'Clipboard.setString() and getString()',
    render(): React.Node {
      return <ClipboardExample />;
    },
  },
];
