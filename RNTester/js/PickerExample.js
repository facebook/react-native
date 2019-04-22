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
const ReactNative = require('react-native');
const StyleSheet = require('StyleSheet');

const {Picker, Text} = ReactNative;

const Item = Picker.Item;

type State = {
  value: string | number,
};

class BasicPickerExample extends React.Component<{}, State> {
  state = {
    value: 'key1',
  };

  render() {
    return (
<<<<<<< HEAD
      <RNTesterPage title="<Picker>">
        <RNTesterBlock title="Basic Picker">
          <Picker
            testID="basic-picker"
            style={styles.picker}
            selectedValue={this.state.selected1}
            onValueChange={this.onValueChange.bind(this, 'selected1')}>
            <Item label="hello" value="key0" />
            <Item label="world" value="key1" />
          </Picker>
        </RNTesterBlock>
        <RNTesterBlock title="Disabled picker">
          <Picker
            style={styles.picker}
            enabled={false}
            selectedValue={this.state.selected1}>
            <Item label="hello" value="key0" />
            <Item label="world" value="key1" />
          </Picker>
        </RNTesterBlock>
        <RNTesterBlock title="Dropdown Picker">
          <Picker
            style={styles.picker}
            selectedValue={this.state.selected2}
            onValueChange={this.onValueChange.bind(this, 'selected2')}
            mode="dropdown">
            <Item label="hello" value="key0" />
            <Item label="world" value="key1" />
          </Picker>
        </RNTesterBlock>
        <RNTesterBlock title="Picker with prompt message">
          <Picker
            style={styles.picker}
            selectedValue={this.state.selected3}
            onValueChange={this.onValueChange.bind(this, 'selected3')}
            prompt="Pick one, just one">
            <Item label="hello" value="key0" />
            <Item label="world" value="key1" />
          </Picker>
        </RNTesterBlock>
        <RNTesterBlock title="Picker with no listener">
          <Picker style={styles.picker}>
            <Item label="hello" value="key0" />
            <Item label="world" value="key1" />
          </Picker>
          <Text>
            Cannot change the value of this picker because it doesn't update
            selectedValue.
          </Text>
        </RNTesterBlock>
        <RNTesterBlock title="Colorful pickers">
          <Picker
            style={[styles.picker, {color: 'white', backgroundColor: '#333'}]}
            selectedValue={this.state.color}
            onValueChange={this.onValueChange.bind(this, 'color')}
            mode="dropdown">
            <Item label="red" color="red" value="red" />
            <Item label="green" color="green" value="green" />
            <Item label="blue" color="blue" value="blue" />
          </Picker>
          <Picker
            style={styles.picker}
            selectedValue={this.state.color}
            onValueChange={this.onValueChange.bind(this, 'color')}
            mode="dialog">
            <Item label="red" color="red" value="red" />
            <Item label="green" color="green" value="green" />
            <Item label="blue" color="blue" value="blue" />
          </Picker>
        </RNTesterBlock>
      </RNTesterPage>
=======
      <Picker
        testID="basic-picker"
        style={styles.picker}
        selectedValue={this.state.value}
        onValueChange={v => this.setState({value: v})}>
        <Item label="hello" value="key0" />
        <Item label="world" value="key1" />
      </Picker>
>>>>>>> v0.59.0
    );
  }
}

class DisabledPickerExample extends React.Component<{}, State> {
  state = {
    value: 'key1',
  };

  render() {
    return (
      <Picker
        style={styles.picker}
        enabled={false}
        selectedValue={this.state.value}>
        <Item label="hello" value="key0" />
        <Item label="world" value="key1" />
      </Picker>
    );
  }
}

class DropdownPickerExample extends React.Component<{}, State> {
  state = {
    value: 'key1',
  };

  render() {
    return (
      <Picker
        style={styles.picker}
        selectedValue={this.state.value}
        onValueChange={v => this.setState({value: v})}
        mode="dropdown">
        <Item label="hello" value="key0" />
        <Item label="world" value="key1" />
      </Picker>
    );
  }
}

class PromptPickerExample extends React.Component<{}, State> {
  state = {
    value: 'key1',
  };

  render() {
    return (
      <Picker
        style={styles.picker}
        selectedValue={this.state.value}
        onValueChange={v => this.setState({value: v})}
        prompt="Pick one, just one">
        <Item label="hello" value="key0" />
        <Item label="world" value="key1" />
      </Picker>
    );
  }
}

type ColorState = {
  color: string | number,
};

class ColorPickerExample extends React.Component<{}, ColorState> {
  state = {
    color: 'red',
  };

  render() {
    return (
      <>
        <Picker
          style={[styles.picker, {color: 'white', backgroundColor: '#333'}]}
          selectedValue={this.state.color}
          onValueChange={v => this.setState({color: v})}
          mode="dropdown">
          <Item label="red" color="red" value="red" />
          <Item label="green" color="green" value="green" />
          <Item label="blue" color="blue" value="blue" />
        </Picker>
        <Picker
          style={styles.picker}
          selectedValue={this.state.color}
          onValueChange={v => this.setState({color: v})}
          mode="dialog">
          <Item label="red" color="red" value="red" />
          <Item label="green" color="green" value="green" />
          <Item label="blue" color="blue" value="blue" />
        </Picker>
      </>
    );
  }
}

const styles = StyleSheet.create({
  picker: {
    width: 100,
  },
});

exports.title = '<Picker>';
exports.description =
  'Provides multiple options to choose from, using either a dropdown menu or a dialog.';
exports.examples = [
  {
    title: 'Basic Picker',
    render: function(): React.Element<typeof BasicPickerExample> {
      return <BasicPickerExample />;
    },
  },
  {
    title: 'Disabled Picker',
    render: function(): React.Element<typeof DisabledPickerExample> {
      return <DisabledPickerExample />;
    },
  },
  {
    title: 'Dropdown Picker',
    render: function(): React.Element<typeof DropdownPickerExample> {
      return <DropdownPickerExample />;
    },
  },
  {
    title: 'Picker with prompt message',
    render: function(): React.Element<typeof PromptPickerExample> {
      return <PromptPickerExample />;
    },
  },
  {
    title: 'Picker with no listener',
    render: function(): React.Element<typeof PromptPickerExample> {
      return (
        <>
          <Picker style={styles.picker}>
            <Item label="hello" value="key0" />
            <Item label="world" value="key1" />
          </Picker>
          <Text>
            Cannot change the value of this picker because it doesn't update
            selectedValue.
          </Text>
        </>
      );
    },
  },
  {
    title: 'Colorful pickers',
    render: function(): React.Element<typeof ColorPickerExample> {
      return <ColorPickerExample />;
    },
  },
];
