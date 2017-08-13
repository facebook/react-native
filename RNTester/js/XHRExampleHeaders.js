/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @noflow
 * @providesModule XHRExampleHeaders
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

class XHRExampleHeaders extends React.Component {

  xhr: XMLHttpRequest;
  cancelled: boolean;

  constructor(props) {
    super(props);
    this.cancelled = false;
    this.state = {
      status: '',
      headers: '',
      contentSize: 1,
      downloaded: 0,
    };
  }

  download() {
    this.xhr && this.xhr.abort();

    var xhr = this.xhr || new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.DONE) {
        if (this.cancelled) {
          this.cancelled = false;
          return;
        }
        if (xhr.status === 200) {
          this.setState({
            status: 'Download complete!',
            headers: xhr.getAllResponseHeaders()
          });
        } else if (xhr.status !== 0) {
          this.setState({
            status: 'Error: Server returned HTTP status of ' + xhr.status + ' ' + xhr.responseText,
          });
        } else {
          this.setState({
            status: 'Error: ' + xhr.responseText,
          });
        }
      }
    };
    xhr.open('GET', 'https://httpbin.org/response-headers?header1=value&header2=value1&header2=value2');
    xhr.send();
    this.xhr = xhr;

    this.setState({status: 'Downloading...'});
  }

  componentWillUnmount() {
    this.cancelled = true;
    this.xhr && this.xhr.abort();
  }

  render() {
    var button = this.state.status === 'Downloading...' ? (
      <View style={styles.wrapper}>
        <View style={styles.button}>
          <Text>...</Text>
        </View>
      </View>
    ) : (
      <TouchableHighlight
        style={styles.wrapper}
        onPress={this.download.bind(this)}>
        <View style={styles.button}>
         <Text>Get headers</Text>
        </View>
      </TouchableHighlight>
    );

    return (
      <View>
        {button}
        <Text>{this.state.headers}</Text>
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

module.exports = XHRExampleHeaders;
