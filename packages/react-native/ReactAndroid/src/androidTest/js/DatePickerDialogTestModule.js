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
const {DatePickerAndroid, NativeModules, View} = require('react-native');
const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge');

const {DatePickerDialogRecordingModule: RecordingModule} = NativeModules;

class DatePickerDialogTestApp extends React.Component {
  render() {
    return <View />;
  }
}

const DatePickerDialogTestModule = {
  DatePickerDialogTestApp: DatePickerDialogTestApp,
  showDatePickerDialog: function(options) {
    DatePickerAndroid.open(options).then(
      ({action, year, month, day}) => {
        if (action === DatePickerAndroid.dateSetAction) {
          RecordingModule.recordDate(year, month, day);
        } else if (action === DatePickerAndroid.dismissedAction) {
          RecordingModule.recordDismissed();
        }
      },
      ({code, message}) => RecordingModule.recordError(),
    );
  },
};

BatchedBridge.registerCallableModule(
  'DatePickerDialogTestModule',
  DatePickerDialogTestModule,
);

module.exports = DatePickerDialogTestModule;
