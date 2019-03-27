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
const TimePickerAndroid = require('TimePickerAndroid');
const React = require('React');
const RecordingModule = require('NativeModules')
  .TimePickerDialogRecordingModule;
const View = require('View');

class TimePickerDialogTestApp extends React.Component {
  render() {
    return <View />;
  }
}

const TimePickerDialogTestModule = {
  TimePickerDialogTestApp: TimePickerDialogTestApp,
  showTimePickerDialog: function(options) {
    TimePickerAndroid.open(options).then(
      ({action, hour, minute}) => {
        if (action === TimePickerAndroid.timeSetAction) {
          RecordingModule.recordTime(hour, minute);
        } else if (action === TimePickerAndroid.dismissedAction) {
          RecordingModule.recordDismissed();
        }
      },
      ({code, message}) => RecordingModule.recordError(),
    );
  },
};

BatchedBridge.registerCallableModule(
  'TimePickerDialogTestModule',
  TimePickerDialogTestModule,
);

module.exports = TimePickerDialogTestModule;
