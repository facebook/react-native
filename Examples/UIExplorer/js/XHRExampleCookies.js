/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 * @providesModule XHRExampleCookies
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  WebView,
} = ReactNative;

var RCTNetworking = require('RCTNetworking');

class XHRExampleCookies extends React.Component {
  state: any;
  cancelled: boolean;

  constructor(props: any) {
    super(props);
    this.cancelled = false;
    this.state = {
      status: '',
      a: 1,
      b: 2,
    };
  }

  setCookie(domain: string) {
    var {a, b} = this.state;
    var url = `https://${domain}/cookies/set?a=${a}&b=${b}`;
    fetch(url).then((response) => {
      this.setStatus(`Cookies a=${a}, b=${b} set`);
      this.refreshWebview();
    });

    this.setState({
      status: 'Setting cookies...',
      a: a + 1,
      b: b + 2,
    });
  }

  getCookies(domain: string) {
    fetch(`https://${domain}/cookies`).then((response) => {
      return response.json();
    }).then((data) => {
      this.setStatus(`Got cookies ${JSON.stringify(data.cookies)} from server`);
      this.refreshWebview();
    });

    this.setStatus('Getting cookies...');
  }

  clearCookies() {
    RCTNetworking.clearCookies((cleared) => {
      this.setStatus('Cookies cleared, had cookies=' + cleared.toString());
      this.refreshWebview();
    });
  }

  refreshWebview() {
    this.refs.webview.reload();
  }

  setStatus(status: string) {
    this.setState({status});
  }

  render() {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this.setCookie.bind(this, 'httpbin.org')}>
          <View style={styles.button}>
            <Text>Set cookie</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this.setCookie.bind(this, 'eu.httpbin.org')}>
          <View style={styles.button}>
            <Text>Set cookie (EU)</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this.getCookies.bind(this, 'httpbin.org')}>
          <View style={styles.button}>
            <Text>Get cookies</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this.getCookies.bind(this, 'eu.httpbin.org')}>
          <View style={styles.button}>
            <Text>Get cookies (EU)</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this.clearCookies.bind(this)}>
          <View style={styles.button}>
            <Text>Clear cookies</Text>
          </View>
        </TouchableHighlight>
        <Text>{this.state.status}</Text>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this.refreshWebview.bind(this)}>
          <View style={styles.button}>
            <Text>Refresh Webview</Text>
          </View>
        </TouchableHighlight>
        <WebView
          ref="webview"
          source={{uri: 'http://httpbin.org/cookies'}}
          style={{height: 100}}
        />
      </View>
    );
  }
}

var styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 8,
  },
});

module.exports = XHRExampleCookies;
