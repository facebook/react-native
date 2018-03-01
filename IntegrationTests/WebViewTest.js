/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule WebViewTest
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  WebView,
} = ReactNative;

var { TestModule } = ReactNative.NativeModules;

class WebViewTest extends React.Component {

  render() {
    var firstMessageReceived = false;
    var secondMessageReceived = false;
    function processMessage(e) {
      var message = e.nativeEvent.data;
      if (message === 'First') {firstMessageReceived = true;}
      if (message === 'Second') {secondMessageReceived = true;}

      // got both messages
      if (firstMessageReceived && secondMessageReceived) {TestModule.markTestPassed(true);}
      // wait for next message
      else if (firstMessageReceived && !secondMessageReceived) {return;}
      // first message got lost
      else if (!firstMessageReceived && secondMessageReceived) {throw new Error('First message got lost');}
    }
    var html = 'Hello world'
      + '<script>'
      + "window.setTimeout(function(){window.postMessage('First'); window.postMessage('Second')}, 0)"
      + '</script>';

    // fail if messages didn't get through;
    window.setTimeout(function() { throw new Error(firstMessageReceived ? 'Both messages got lost' : 'Second message got lost');}, 10000);

    var source = {
      html: html,
      };

    return (
      <WebView
        source={source}
        onMessage = {processMessage}
        />
    );
  }
}

WebViewTest.displayName = 'WebViewTest';

module.exports = WebViewTest;
