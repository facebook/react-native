/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DatePickerDialogTestModule
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var DatePickerAndroid = require('DatePickerAndroid');
var React = require('React');
var RecordingModule = require('NativeModules').DatePickerDialogRecordingModule;
var View = require('View');

var DatePickerDialogTestApp = React.createClass({
  render: function() {
    return (<View />);
  },
});

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
      ({code, message}) => RecordingModule.recordError()
    );
  },
};

BatchedBridge.registerCallableModule(
  'DatePickerDialogTestModule',
  DatePickerDialogTestModule
);

module.exports = DatePickerDialogTestModule;
