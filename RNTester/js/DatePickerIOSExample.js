/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule DatePickerIOSExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  DatePickerIOS,
  StyleSheet,
  Text,
  TextInput,
  View,
} = ReactNative;

class DatePickerExample extends React.Component {
  static defaultProps = {
    date: new Date(),
    timeZoneOffsetInHours: (-1) * (new Date()).getTimezoneOffset() / 60,
  };

  state = {
    date: this.props.date,
    timeZoneOffsetInHours: this.props.timeZoneOffsetInHours,
  };

  onDateChange = (date) => {
    this.setState({date: date});
  };

  onTimezoneChange = (event) => {
    var offset = parseInt(event.nativeEvent.text, 10);
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
          <Text>{
            this.state.date.toLocaleDateString() +
            ' ' +
            this.state.date.toLocaleTimeString()
          }</Text>
        </WithLabel>
        <WithLabel label="Timezone:">
          <TextInput
            onChange={this.onTimezoneChange}
            style={styles.textinput}
            value={this.state.timeZoneOffsetInHours.toString()}
          />
          <Text> hours from UTC</Text>
        </WithLabel>
        <Heading label="Date + time picker" />
        <DatePickerIOS
          date={this.state.date}
          mode="datetime"
          timeZoneOffsetInMinutes={this.state.timeZoneOffsetInHours * 60}
          onDateChange={this.onDateChange}
        />
        <Heading label="Date picker" />
        <DatePickerIOS
          date={this.state.date}
          mode="date"
          timeZoneOffsetInMinutes={this.state.timeZoneOffsetInHours * 60}
          onDateChange={this.onDateChange}
        />
        <Heading label="Time picker, 10-minute interval" />
        <DatePickerIOS
          date={this.state.date}
          mode="time"
          timeZoneOffsetInMinutes={this.state.timeZoneOffsetInHours * 60}
          onDateChange={this.onDateChange}
          minuteInterval={10}
        />
      </View>
    );
  }
}

class WithLabel extends React.Component {
  render() {
    return (
      <View style={styles.labelContainer}>
        <View style={styles.labelView}>
          <Text style={styles.label}>
            {this.props.label}
          </Text>
        </View>
        {this.props.children}
      </View>
    );
  }
}

class Heading extends React.Component {
  render() {
    return (
      <View style={styles.headingContainer}>
        <Text style={styles.heading}>
          {this.props.label}
        </Text>
      </View>
    );
  }
}

exports.displayName = (undefined: ?string);
exports.title = '<DatePickerIOS>';
exports.description = 'Select dates and times using the native UIDatePicker.';
exports.examples = [
{
  title: '<DatePickerIOS>',
  render: function(): React.Element<any> {
    return <DatePickerExample />;
  },
}];

var styles = StyleSheet.create({
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
  headingContainer: {
    padding: 4,
    backgroundColor: '#f6f7f8',
  },
  heading: {
    fontWeight: '500',
    fontSize: 14,
  },
});
