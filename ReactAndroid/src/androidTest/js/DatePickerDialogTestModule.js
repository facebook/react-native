/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var DatePickerAndroid = require('DatePickerAndroid');
var React = require('React');
var RecordingModule = require('NativeModules').DatePickerDialogRecordingModule;
var View = require('View');

class DatePickerDialogTestApp extends React.Component {
  render() {
    return <View />;
  }
}

var DatePickerDialogTestModule = {
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
