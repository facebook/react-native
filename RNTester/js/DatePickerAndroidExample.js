/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  DatePickerAndroid,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} = ReactNative;

var RNTesterBlock = require('./RNTesterBlock');
var RNTesterPage = require('./RNTesterPage');

class DatePickerAndroidExample extends React.Component {
  static title = 'DatePickerAndroid';
  static description = 'Standard Android date picker dialog';

  state = {
    presetDate: new Date(2020, 4, 5),
    simpleDate: new Date(2020, 4, 5),
    spinnerDate: new Date(2020, 4, 5),
    calendarDate: new Date(2020, 4, 5),
    defaultDate: new Date(2020, 4, 5),
    allDate: new Date(2020, 4, 5),
    simpleText: 'pick a date',
    spinnerText: 'pick a date',
    calendarText: 'pick a date',
    defaultText: 'pick a date',
    minText: 'pick a date, no earlier than today',
    maxText: 'pick a date, no later than today',
    presetText: 'pick a date, preset to 2020/5/5',
    allText: 'pick a date between 2020/5/1 and 2020/5/10',
  };

  showPicker = async (stateKey, options) => {
    try {
      var newState = {};
      const {action, year, month, day} = await DatePickerAndroid.open(options);
      if (action === DatePickerAndroid.dismissedAction) {
        newState[stateKey + 'Text'] = 'dismissed';
      } else {
        var date = new Date(year, month, day);
        newState[stateKey + 'Text'] = date.toLocaleDateString();
        newState[stateKey + 'Date'] = date;
      }
      this.setState(newState);
    } catch ({code, message}) {
      console.warn(`Error in example '${stateKey}': `, message);
    }
  };

  render() {
    return (
      <RNTesterPage title="DatePickerAndroid">
        <RNTesterBlock title="Simple date picker">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'simple', {
              date: this.state.simpleDate,
            })}>
            <Text style={styles.text}>{this.state.simpleText}</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Simple spinner date picker">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'spinner', {
              date: this.state.spinnerDate,
              mode: 'spinner',
            })}>
            <Text style={styles.text}>{this.state.spinnerText}</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Simple calendar date picker">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'calendar', {
              date: this.state.calendarDate,
              mode: 'calendar',
            })}>
            <Text style={styles.text}>{this.state.calendarText}</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Simple default date picker">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'default', {
              date: this.state.defaultDate,
              mode: 'default',
            })}>
            <Text style={styles.text}>{this.state.defaultText}</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Date picker with pre-set date">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'preset', {
              date: this.state.presetDate,
            })}>
            <Text style={styles.text}>{this.state.presetText}</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Date picker with minDate">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'min', {
              date: this.state.minDate,
              minDate: new Date(),
            })}>
            <Text style={styles.text}>{this.state.minText}</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Date picker with maxDate">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'max', {
              date: this.state.maxDate,
              maxDate: new Date(),
            })}>
            <Text style={styles.text}>{this.state.maxText}</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Date picker with all options">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'all', {
              date: this.state.allDate,
              minDate: new Date(2020, 4, 1),
              maxDate: new Date(2020, 4, 10),
            })}>
            <Text style={styles.text}>{this.state.allText}</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
      </RNTesterPage>
    );
  }
}

var styles = StyleSheet.create({
  text: {
    color: 'black',
  },
});

module.exports = DatePickerAndroidExample;
