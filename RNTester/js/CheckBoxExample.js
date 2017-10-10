/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule CheckBoxExample
 * @format
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {CheckBox, Text, View} = ReactNative;

class BasicCheckBoxExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    trueCheckBoxIsOn: true,
    falseCheckBoxIsOn: false,
  };

  render() {
    return (
      <View>
        <CheckBox
          onValueChange={value => this.setState({falseCheckBoxIsOn: value})}
          style={{marginBottom: 10}}
          value={this.state.falseCheckBoxIsOn}
        />
        <CheckBox
          onValueChange={value => this.setState({trueCheckBoxIsOn: value})}
          value={this.state.trueCheckBoxIsOn}
        />
      </View>
    );
  }
}

class DisabledCheckBoxExample extends React.Component<{}, $FlowFixMeState> {
  render() {
    return (
      <View>
        <CheckBox disabled={true} style={{marginBottom: 10}} value={true} />
        <CheckBox disabled={true} value={false} />
      </View>
    );
  }
}

class EventCheckBoxExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    eventCheckBoxIsOn: false,
    eventCheckBoxRegressionIsOn: true,
  };

  render() {
    return (
      <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
        <View>
          <CheckBox
            onValueChange={value => this.setState({eventCheckBoxIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventCheckBoxIsOn}
          />
          <CheckBox
            onValueChange={value => this.setState({eventCheckBoxIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventCheckBoxIsOn}
          />
          <Text>{this.state.eventCheckBoxIsOn ? 'On' : 'Off'}</Text>
        </View>
        <View>
          <CheckBox
            onValueChange={value =>
              this.setState({eventCheckBoxRegressionIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventCheckBoxRegressionIsOn}
          />
          <CheckBox
            onValueChange={value =>
              this.setState({eventCheckBoxRegressionIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventCheckBoxRegressionIsOn}
          />
          <Text>{this.state.eventCheckBoxRegressionIsOn ? 'On' : 'Off'}</Text>
        </View>
      </View>
    );
  }
}

let examples = [
  {
    title: 'CheckBoxes can be set to true or false',
    render(): React.Element<any> {
      return <BasicCheckBoxExample />;
    },
  },
  {
    title: 'CheckBoxes can be disabled',
    render(): React.Element<any> {
      return <DisabledCheckBoxExample />;
    },
  },
  {
    title: 'Change events can be detected',
    render(): React.Element<any> {
      return <EventCheckBoxExample />;
    },
  },
  {
    title: 'CheckBoxes are controlled components',
    render(): React.Element<any> {
      return <CheckBox />;
    },
  },
];

exports.title = '<CheckBox>';
exports.displayName = 'CheckBoxExample';
exports.description = 'Native boolean input';
exports.examples = examples;
