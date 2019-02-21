/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {DatePickerIOS, StyleSheet, Text, TextInput, View} = ReactNative;

type State = {|
  date: Date,
  timeZoneOffsetInHours: number,
|};

type Props = {|
  children: (State, (Date) => void) => React.Node,
|};

class WithDatePickerData extends React.Component<Props, State> {
  state = {
    date: new Date(),
    timeZoneOffsetInHours: (-1 * new Date().getTimezoneOffset()) / 60,
  };

  onDateChange = date => {
    this.setState({date: date});
  };

  onTimezoneChange = event => {
    const offset = parseInt(event.nativeEvent.text, 10);
    if (isNaN(offset)) {
      return;
    }
    this.setState({timeZoneOffsetInHours: offset});
  };

  render() {
    // Ideally, the timezone input would be a picker rather than a
    // text input, but we don't have any pickers yet :(
    return (
      <View>
        <WithLabel label="Value:">
          <Text testID="date-and-time-indicator">
            {this.state.date.toLocaleDateString() +
              ' ' +
              this.state.date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
          </Text>
        </WithLabel>
        <WithLabel label="Timezone:">
          <TextInput
            onChange={this.onTimezoneChange}
            style={styles.textinput}
            value={this.state.timeZoneOffsetInHours.toString()}
          />
          <Text> hours from UTC</Text>
        </WithLabel>
        {this.props.children(this.state, this.onDateChange)}
      </View>
    );
  }
}

type LabelProps = {|
  label: string,
  children: React.Node,
|};

class WithLabel extends React.Component<LabelProps> {
  render() {
    return (
      <View style={styles.labelContainer}>
        <View style={styles.labelView}>
          <Text style={styles.label}>{this.props.label}</Text>
        </View>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  textinput: {
    height: 26,
    width: 50,
    borderWidth: 0.5,
    borderColor: '#0f0f0f',
    padding: 4,
    fontSize: 13,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  labelView: {
    marginRight: 10,
    paddingVertical: 2,
  },
  label: {
    fontWeight: '500',
  },
});

exports.title = '<DatePickerIOS>';
exports.description = 'Select dates and times using the native UIDatePicker.';
exports.examples = [
  {
    title: 'Date and time picker',
    render: function(): React.Element<any> {
      return (
        <WithDatePickerData>
          {(state, onDateChange) => (
            <DatePickerIOS
              testID="date-and-time"
              date={state.date}
              mode="datetime"
              timeZoneOffsetInMinutes={state.timeZoneOffsetInHours * 60}
              onDateChange={onDateChange}
            />
          )}
        </WithDatePickerData>
      );
    },
  },
  {
    title: 'Date only picker',
    render: function(): React.Element<any> {
      return (
        <WithDatePickerData>
          {(state, onDateChange) => (
            <DatePickerIOS
              testID="date-only"
              date={state.date}
              mode="date"
              timeZoneOffsetInMinutes={state.timeZoneOffsetInHours * 60}
              onDateChange={onDateChange}
            />
          )}
        </WithDatePickerData>
      );
    },
  },
  {
    title: 'Time only picker, 10-minute interval',
    render: function(): React.Element<any> {
      return (
        <WithDatePickerData>
          {(state, onDateChange) => (
            <DatePickerIOS
              testID="time-only"
              date={state.date}
              mode="time"
              timeZoneOffsetInMinutes={state.timeZoneOffsetInHours * 60}
              onDateChange={onDateChange}
            />
          )}
        </WithDatePickerData>
      );
    },
  },
];
