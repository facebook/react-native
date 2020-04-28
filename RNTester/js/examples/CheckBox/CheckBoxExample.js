/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const React = require('react');
const {CheckBox, Text, View, StyleSheet} = require('react-native');

type BasicState = {|
  trueCheckBoxIsOn: boolean,
  falseCheckBoxIsOn: boolean,
|};

type BasicProps = $ReadOnly<{||}>;
class BasicCheckBoxExample extends React.Component<BasicProps, BasicState> {
  state = {
    trueCheckBoxIsOn: true,
    falseCheckBoxIsOn: false,
  };

  render() {
    return (
      <View>
        <CheckBox
          onValueChange={value => this.setState({falseCheckBoxIsOn: value})}
          style={styles.checkbox}
          value={this.state.falseCheckBoxIsOn}
          tintColors={{false: 'red'}}
        />
        <CheckBox
          onValueChange={value => this.setState({trueCheckBoxIsOn: value})}
          value={this.state.trueCheckBoxIsOn}
          tintColors={{true: 'green'}}
        />
      </View>
    );
  }
}

type DisabledProps = $ReadOnly<{||}>;
class DisabledCheckBoxExample extends React.Component<DisabledProps> {
  render() {
    return (
      <View>
        <CheckBox disabled={true} style={styles.checkbox} value={true} />
        <CheckBox disabled={true} value={false} />
      </View>
    );
  }
}

type EventProps = $ReadOnly<{||}>;
type EventState = {|
  eventCheckBoxIsOn: boolean,
  eventCheckBoxRegressionIsOn: boolean,
|};

class EventCheckBoxExample extends React.Component<EventProps, EventState> {
  state = {
    eventCheckBoxIsOn: false,
    eventCheckBoxRegressionIsOn: true,
  };

  render() {
    return (
      <View style={styles.container}>
        <View>
          <CheckBox
            onValueChange={value => this.setState({eventCheckBoxIsOn: value})}
            style={styles.checkbox}
            value={this.state.eventCheckBoxIsOn}
          />
          <CheckBox
            onValueChange={value => this.setState({eventCheckBoxIsOn: value})}
            style={styles.checkbox}
            value={this.state.eventCheckBoxIsOn}
          />
          <Text>{this.state.eventCheckBoxIsOn ? 'On' : 'Off'}</Text>
        </View>
        <View>
          <CheckBox
            onValueChange={value =>
              this.setState({eventCheckBoxRegressionIsOn: value})
            }
            style={styles.checkbox}
            value={this.state.eventCheckBoxRegressionIsOn}
          />
          <CheckBox
            onValueChange={value =>
              this.setState({eventCheckBoxRegressionIsOn: value})
            }
            style={styles.checkbox}
            value={this.state.eventCheckBoxRegressionIsOn}
          />
          <Text>{this.state.eventCheckBoxRegressionIsOn ? 'On' : 'Off'}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  checkbox: {
    marginBottom: 10,
  },
});

exports.title = '<CheckBox>';
exports.displayName = 'CheckBoxExample';
exports.description = 'Native boolean input';
exports.examples = [
  {
    title:
      'CheckBoxes can be set to true or false, and the color of both states can be specified.',
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
