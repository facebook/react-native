/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WebViewExternalLinksTest
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  View,
  WebView,
} = React;

var WebViewExternalLinksTest = React.createClass({
  render: function() {
    var html = (linkText) => {
      return `
        <html>
          <body>
            <a href="https://github.com/facebook/react-native">
              ${linkText}
            </a>
          </body>
        </html>
      `;
    };

    return (
      <View style={styles.container}>
        <WebView
          style={styles.webView}
          html={html('This link should open in the WebView.')}
        />
        <WebView
          style={styles.webView}
          html={html('This link should open in Safari.')}
          openLinksInExternalBrowser={true}
        />
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    marginTop: 80,
    height: 100,
  },
});

module.exports = WebViewExternalLinksTest;
