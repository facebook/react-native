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
const {NativeModules, TimePickerAndroid, View} = require('react-native');
const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge');

const {TimePickerDialogRecordingModule: RecordingModule} = NativeModules;

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
