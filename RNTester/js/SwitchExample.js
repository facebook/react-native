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
var {Platform, Switch, Text, View} = ReactNative;

class BasicSwitchExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    trueSwitchIsOn: true,
    falseSwitchIsOn: false,
  };

  render() {
    return (
      <View>
        <Switch
          onValueChange={value => this.setState({falseSwitchIsOn: value})}
          style={{marginBottom: 10}}
          value={this.state.falseSwitchIsOn}
        />
        <Switch
          onValueChange={value => this.setState({trueSwitchIsOn: value})}
          value={this.state.trueSwitchIsOn}
        />
      </View>
    );
  }
}

class DisabledSwitchExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <Switch disabled={true} style={{marginBottom: 10}} value={true} />
        <Switch disabled={true} value={false} />
      </View>
    );
  }
}

class ColorSwitchExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    colorTrueSwitchIsOn: true,
    colorFalseSwitchIsOn: false,
  };

  render() {
    return (
      <View>
        <Switch
          onValueChange={value => this.setState({colorFalseSwitchIsOn: value})}
          style={{marginBottom: 10}}
          thumbColor="#0000ff"
          trackColor={{
            false: '#ff0000',
            true: '#00ff00',
          }}
          value={this.state.colorFalseSwitchIsOn}
        />
        <Switch
          onValueChange={value => this.setState({colorTrueSwitchIsOn: value})}
          thumbColor="#0000ff"
          trackColor={{
            false: '#ff0000',
            true: '#00ff00',
          }}
          value={this.state.colorTrueSwitchIsOn}
        />
      </View>
    );
  }
}

class EventSwitchExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    eventSwitchIsOn: false,
    eventSwitchRegressionIsOn: true,
  };

  render() {
    return (
      <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
        <View>
          <Switch
            onValueChange={value => this.setState({eventSwitchIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchIsOn}
          />
          <Switch
            onValueChange={value => this.setState({eventSwitchIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchIsOn}
          />
          <Text>{this.state.eventSwitchIsOn ? 'On' : 'Off'}</Text>
        </View>
        <View>
          <Switch
            onValueChange={value =>
              this.setState({eventSwitchRegressionIsOn: value})
            }
            style={{marginBottom: 10}}
            value={this.state.eventSwitchRegressionIsOn}
          />
          <Switch
            onValueChange={value =>
              this.setState({eventSwitchRegressionIsOn: value})
            }
            style={{marginBottom: 10}}
            value={this.state.eventSwitchRegressionIsOn}
          />
          <Text>{this.state.eventSwitchRegressionIsOn ? 'On' : 'Off'}</Text>
        </View>
      </View>
    );
  }
}

var examples = [
  {
    title: 'Switches can be set to true or false',
    render(): React.Element<any> {
      return <BasicSwitchExample />;
    },
  },
  {
    title: 'Switches can be disabled',
    render(): React.Element<any> {
      return <DisabledSwitchExample />;
    },
  },
  {
    title: 'Change events can be detected',
    render(): React.Element<any> {
      return <EventSwitchExample />;
    },
  },
  {
    title: 'Switches are controlled components',
    render(): React.Element<any> {
      return <Switch />;
    },
  },
  {
    title: 'Custom colors can be provided',
    render(): React.Element<any> {
      return <ColorSwitchExample />;
    },
  },
];

exports.title = '<Switch>';
exports.displayName = 'SwitchExample';
exports.description = 'Native boolean input';
exports.examples = examples;
