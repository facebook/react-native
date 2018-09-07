/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {Clipboard, View, Text} = ReactNative;

class ClipboardExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    content: 'Content will appear here',
  };

  _setClipboardContent = async () => {
    Clipboard.setString('Hello World');
    try {
      var content = await Clipboard.getString();
      this.setState({content});
    } catch (e) {
      this.setState({content: e.message});
    }
  };

  render() {
    return (
      <View>
        <Text onPress={this._setClipboardContent} style={{color: 'blue'}}>
          Tap to put "Hello World" in the clipboard
        </Text>
        <Text style={{color: 'red', marginTop: 20}}>{this.state.content}</Text>
      </View>
    );
  }
}

exports.title = 'Clipboard';
exports.description = 'Show Clipboard contents.';
exports.examples = [
  {
    title: 'Clipboard.setString() and getString()',
    render() {
      return <ClipboardExample />;
    },
  },
];
