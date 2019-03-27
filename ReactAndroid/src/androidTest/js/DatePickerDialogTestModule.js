/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const BatchedBridge = require('BatchedBridge');
const DatePickerAndroid = require('DatePickerAndroid');
const React = require('React');
const RecordingModule = require('NativeModules')
  .DatePickerDialogRecordingModule;
const View = require('View');

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
