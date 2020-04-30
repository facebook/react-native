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
const {NativeModules, Share, View} = require('react-native');
const BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge');

const {ShareRecordingModule: RecordingModule} = NativeModules;

class ShareTestApp extends React.Component {
  render() {
    return <View />;
  }
}

const ShareTestModule = {
  ShareTestApp: ShareTestApp,
  showShareDialog: function(content, options) {
    Share.share(content, options).then(
      () => RecordingModule.recordOpened(),
      ({code, message}) => RecordingModule.recordError(),
    );
  },
};

BatchedBridge.registerCallableModule('ShareTestModule', ShareTestModule);

module.exports = ShareTestModule;
