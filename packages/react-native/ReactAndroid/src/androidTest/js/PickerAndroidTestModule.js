/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {NativeModules, Picker, View} = require('react-native');
const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge');

const {Recording: RecordingModule} = NativeModules;
const Item = Picker.Item;

let appInstance;

class PickerAndroidTestApp extends React.Component {
  state = {
    selected: 1,
    mode: 'dropdown',
    style: {},
  };

  UNSAFE_componentWillMount() {
    appInstance = this;
  }

  render() {
    return (
      <View collapsable={false}>
        <Picker
          mode="dialog"
          prompt="prompt"
          style={this.state.style}
          selectedValue={this.state.selected}
          onValueChange={this.onValueChange}>
          <Item label="item1" color="#ff0000" value={0} />
          <Item label="item2" color="#00ff00" value={1} />
          <Item label="item3" color="#0000ff" value={2} />
        </Picker>
        <Picker mode={this.state.mode}>
          <Item label="item1" />
          <Item label="item2" />
        </Picker>
        <Picker enabled={false}>
          <Item label="item1" />
          <Item label="item2" />
        </Picker>
        <Picker
          mode="dropdown"
          selectedValue={this.state.selected}
          onValueChange={this.onValueChange}>
          <Item label="item in sync 1" value={0} />
          <Item label="item in sync 2" value={1} />
          <Item label="item in sync 3" value={2} />
        </Picker>
      </View>
    );
  }

  onValueChange = value => {
    this.setState({selected: value});
    RecordingModule.recordSelection(value);
  };
}

const PickerAndroidTestModule = {
  PickerAndroidTestApp: PickerAndroidTestApp,
  selectItem: function(value) {
    appInstance.setState({selected: value});
  },
  setMode: function(mode) {
    appInstance.setState({mode: mode});
  },
  setPrimaryColor: function(color) {
    appInstance.setState({style: {color}});
  },
};

BatchedBridge.registerCallableModule(
  'PickerAndroidTestModule',
  PickerAndroidTestModule,
);

module.exports = PickerAndroidTestModule;
