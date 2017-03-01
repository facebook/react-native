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
 * @providesModule XHRExampleOnTimeOut
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = ReactNative;

class XHRExampleOnTimeOut extends React.Component {
  state: any;
  xhr: XMLHttpRequest;

  constructor(props: any) {
    super(props);
    this.state = {
      status: '',
      loading: false
    };
  }

  loadTimeOutRequest() {
    this.xhr && this.xhr.abort();

    var xhr = this.xhr || new XMLHttpRequest();

    xhr.onerror = ()=> {
      console.log('Status ', xhr.status);
      console.log('Error ', xhr.responseText);
    };

    xhr.ontimeout = () => {
      this.setState({
        status: xhr.responseText,
        loading: false
      });
    };

    xhr.onload = () => {
      console.log('Status ', xhr.status);
      console.log('Response ', xhr.responseText);
    };

    xhr.open('GET', 'https://httpbin.org/delay/5'); // request to take 5 seconds to load
    xhr.timeout = 2000; // request times out in 2 seconds
    xhr.send();
    this.xhr = xhr;

    this.setState({loading: true});
  }

  componentWillUnmount() {
    this.xhr && this.xhr.abort();
  }

  render() {
    var button = this.state.loading ? (
      <View style={styles.wrapper}>
        <View style={styles.button}>
          <Text>Loading...</Text>
        </View>
      </View>
    ) : (
      <TouchableHighlight
        style={styles.wrapper}
        onPress={this.loadTimeOutRequest.bind(this)}>
        <View style={styles.button}>
         <Text>Make Time Out Request</Text>
        </View>
      </TouchableHighlight>
    );

    return (
      <View>
        {button}
        <Text>{this.state.status}</Text>
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

module.exports = XHRExampleOnTimeOut;
