/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ShareTestModule
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var React = require('React');
var RecordingModule = require('NativeModules').ShareRecordingModule;
var Share = require('Share');
var View = require('View');

class ShareTestApp extends React.Component {
  render() {
    return (<View />);
  }
}

var ShareTestModule = {
  ShareTestApp: ShareTestApp,
  showShareDialog: function(content, options) {
    Share.share(content, options).then(
      () => RecordingModule.recordOpened(),
      ({code, message}) => RecordingModule.recordError()
    );
  },
};

BatchedBridge.registerCallableModule(
  'ShareTestModule',
  ShareTestModule
);

module.exports = ShareTestModule;
