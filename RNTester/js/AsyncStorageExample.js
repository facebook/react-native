/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {AsyncStorage, PickerIOS, Text, View} = ReactNative;
var PickerItemIOS = PickerIOS.Item;

var STORAGE_KEY = '@AsyncStorageExample:key';
var COLORS = ['red', 'orange', 'yellow', 'green', 'blue'];

class BasicStorageExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    selectedValue: COLORS[0],
    messages: [],
  };

  componentDidMount() {
    this._loadInitialState().done();
  }

  _loadInitialState = async () => {
    try {
      var value = await AsyncStorage.getItem(STORAGE_KEY);
      if (value !== null) {
        this.setState({selectedValue: value});
        this._appendMessage('Recovered selection from disk: ' + value);
      } else {
        this._appendMessage('Initialized with no selection on disk.');
      }
    } catch (error) {
      this._appendMessage('AsyncStorage error: ' + error.message);
    }
  };

  render() {
    var color = this.state.selectedValue;
    return (
      <View>
        <PickerIOS selectedValue={color} onValueChange={this._onValueChange}>
          {COLORS.map(value => (
            <PickerItemIOS key={value} value={value} label={value} />
          ))}
        </PickerIOS>
        <Text>
          {'Selected: '}
          <Text style={{color}}>{this.state.selectedValue}</Text>
        </Text>
        <Text> </Text>
        <Text onPress={this._removeStorage}>
          Press here to remove from storage.
        </Text>
        <Text> </Text>
        <Text>Messages:</Text>
        {this.state.messages.map(m => <Text key={m}>{m}</Text>)}
      </View>
    );
  }

  _onValueChange = async selectedValue => {
    this.setState({selectedValue});
    try {
      await AsyncStorage.setItem(STORAGE_KEY, selectedValue);
      this._appendMessage('Saved selection to disk: ' + selectedValue);
    } catch (error) {
      this._appendMessage('AsyncStorage error: ' + error.message);
    }
  };

  _removeStorage = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this._appendMessage('Selection removed from disk.');
    } catch (error) {
      this._appendMessage('AsyncStorage error: ' + error.message);
    }
  };

  _appendMessage = message => {
    this.setState({messages: this.state.messages.concat(message)});
  };
}

exports.title = 'AsyncStorage';
exports.description = 'Asynchronous local disk storage.';
exports.examples = [
  {
    title: 'Basics - getItem, setItem, removeItem',
    render(): React.Element<any> {
      return <BasicStorageExample />;
    },
  },
];
