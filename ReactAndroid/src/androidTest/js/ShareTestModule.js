/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
