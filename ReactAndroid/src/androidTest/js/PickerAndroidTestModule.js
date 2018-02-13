/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PickerAndroidTestModule
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var RecordingModule = require('NativeModules').PickerAndroidRecordingModule;
var Picker = require('Picker');
var View = require('View');

var Item = Picker.Item;

var appInstance;

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

  onValueChange = (value) => {
    this.setState({selected: value});
    RecordingModule.recordSelection(value);
  };
}

var PickerAndroidTestModule = {
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
  PickerAndroidTestModule
);

module.exports = PickerAndroidTestModule;
