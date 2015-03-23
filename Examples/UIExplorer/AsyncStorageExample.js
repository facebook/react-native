/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  AsyncStorage,
  PickerIOS,
  Text,
  View
} = React;
var PickerItemIOS = PickerIOS.Item;

var STORAGE_KEY = '@AsyncStorageExample:key';
var COLORS = ['red', 'orange', 'yellow', 'green', 'blue'];

var BasicStorageExample = React.createClass({
  componentDidMount() {
    AsyncStorage.getItem(STORAGE_KEY, (error, value) => {
      if (error) {
        this._appendMessage('AsyncStorage error: ' + error.message);
      } else if (value !== null) {
        this.setState({selectedValue: value});
        this._appendMessage('Recovered selection from disk: ' + value);
      } else {
        this._appendMessage('Initialized with no selection on disk.');
      }
    });
  },
  getInitialState() {
    return {
      selectedValue: COLORS[0],
      messages: [],
    };
  },

  render() {
    var color = this.state.selectedValue;
    return (
      <View>
        <PickerIOS
          selectedValue={color}
          onValueChange={this._onValueChange}>
          {COLORS.map((value) => (
            <PickerItemIOS
              key={value}
              value={value}
              label={value}
            />
          ))}
        </PickerIOS>
        <Text>
          {'Selected: '}
          <Text style={{color}}>
            {this.state.selectedValue}
          </Text>
        </Text>
        <Text>{' '}</Text>
        <Text onPress={this._removeStorage}>
          Press here to remove from storage.
        </Text>
        <Text>{' '}</Text>
        <Text>Messages:</Text>
        {this.state.messages.map((m) => <Text>{m}</Text>)}
      </View>
    );
  },

  _onValueChange(selectedValue) {
    this.setState({selectedValue});
    AsyncStorage.setItem(STORAGE_KEY, selectedValue, (error) => {
      if (error) {
        this._appendMessage('AsyncStorage error: ' + error.message);
      } else {
        this._appendMessage('Saved selection to disk: ' + selectedValue);
      }
    });
  },

  _removeStorage() {
    AsyncStorage.removeItem(STORAGE_KEY, (error) => {
      if (error) {
        this._appendMessage('AsyncStorage error: ' + error.message);
      } else {
        this._appendMessage('Selection removed from disk.');
      }
    });
  },

  _appendMessage(message) {
    this.setState({messages: this.state.messages.concat(message)});
  },
});

exports.title = 'AsyncStorage';
exports.description = 'Asynchronous local disk storage.';
exports.examples = [
  {
    title: 'Basics - getItem, setItem, removeItem',
    render(): ReactElement { return <BasicStorageExample />; }
  },
];
