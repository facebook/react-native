/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {WebView} = ReactNative;

const {TestModule} = ReactNative.NativeModules;

class WebViewTest extends React.Component {
  render() {
    let firstMessageReceived = false;
    let secondMessageReceived = false;
    function processMessage(e) {
      const message = e.nativeEvent.data;
      if (message === 'First') {
        firstMessageReceived = true;
      }
      if (message === 'Second') {
        secondMessageReceived = true;
      }

      // got both messages
      if (firstMessageReceived && secondMessageReceived) {
        TestModule.markTestPassed(true);
      }
      // wait for next message
      else if (firstMessageReceived && !secondMessageReceived) {
        return;
      }
      // first message got lost
      else if (!firstMessageReceived && secondMessageReceived) {
        throw new Error('First message got lost');
      }
    }
    const html =
      'Hello world' +
      '<script>' +
      "window.setTimeout(function(){window.postMessage('First'); window.postMessage('Second')}, 0)" +
      '</script>';

    // fail if messages didn't get through;
    window.setTimeout(function() {
      throw new Error(
        firstMessageReceived
          ? 'Both messages got lost'
          : 'Second message got lost',
      );
    }, 10000);

    const source = {
      html: html,
    };

    return (
      <WebView
        source={source}
        onMessage={processMessage}
        originWhitelist={['about:blank']}
      />
    );
  }
}

WebViewTest.displayName = 'WebViewTest';

module.exports = WebViewTest;
