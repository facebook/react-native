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
 * @providesModule XHRExampleDownload
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  Alert,
  Platform,
  ProgressBarAndroid,
  ProgressViewIOS,
  StyleSheet,
  Switch,
  Text,
  TouchableHighlight,
  View,
} = ReactNative;

/**
 * Convert number of bytes to MB and round to the nearest 0.1 MB.
 */
function roundKilo(value: number): number {
  return Math.round(value / 1000);
}

class ProgressBar extends React.Component {
  render() {
    if (Platform.OS === 'android') {
      return (
        <ProgressBarAndroid
          progress={this.props.progress}
          styleAttr="Horizontal"
          indeterminate={false}
        />
      );
    }
    return (
      <ProgressViewIOS
        progress={this.props.progress}
      />
    );
  }
}

class XHRExampleDownload extends React.Component {
  state: Object = {
    downloading: false,
    // set by onreadystatechange
    contentLength: 1,
    responseLength: 0,
    // set by onprogress
    progressTotal: 1,
    progressLoaded: 0,

    readystateHandler: false,
    progressHandler: true,
    arraybuffer: false,
  };

  xhr: ?XMLHttpRequest = null;
  cancelled: boolean = false;

  _download = () => {
    let xhr;
    if (this.xhr) {
      xhr = this.xhr;
      xhr.abort();
    } else {
      xhr = this.xhr = new XMLHttpRequest();
    }

    const onreadystatechange = () => {
      if (xhr.readyState === xhr.HEADERS_RECEIVED) {
        const contentLength =
          parseInt(xhr.getResponseHeader('Content-Length'), 10);
        this.setState({
          contentLength,
          responseLength: 0,
        });
      } else if (xhr.readyState === xhr.LOADING && xhr.response) {
        this.setState({
          responseLength: xhr.response.length,
        });
      }
    };
    const onprogress = (event) => {
      this.setState({
        progressTotal: event.total,
        progressLoaded: event.loaded,
      });
    };

    if (this.state.readystateHandler) {
      xhr.onreadystatechange = onreadystatechange;
    }
    if (this.state.progressHandler) {
      xhr.onprogress = onprogress;
    }
    if (this.state.arraybuffer) {
      xhr.responseType = 'arraybuffer';
    }
    xhr.onload = () => {
      this.setState({downloading: false});
      if (this.cancelled) {
        this.cancelled = false;
        return;
      }
      if (xhr.status === 200) {
        let responseType =
          `Response is a string, ${xhr.response.length} characters long.`;
        if (xhr.response instanceof ArrayBuffer) {
          responseType =
            `Response is an ArrayBuffer, ${xhr.response.byteLength} bytes long.`;
        }
        Alert.alert('Download complete!', responseType);
      } else if (xhr.status !== 0) {
        Alert.alert(
          'Error',
          `Server returned HTTP status of ${xhr.status}: ${xhr.responseText}`
        );
      } else {
        Alert.alert('Error', xhr.responseText);
      }
    };
    xhr.open('GET', 'http://aleph.gutenberg.org/cache/epub/100/pg100.txt.utf8');
    // Avoid gzip so we can actually show progress
    xhr.setRequestHeader('Accept-Encoding', '');
    xhr.send();

    this.setState({downloading: true});
  }

  componentWillUnmount() {
    this.cancelled = true;
    this.xhr && this.xhr.abort();
  }

  render() {
    const button = this.state.downloading ? (
      <View style={styles.wrapper}>
        <View style={styles.button}>
          <Text>Downloading...</Text>
        </View>
      </View>
    ) : (
      <TouchableHighlight
        style={styles.wrapper}
        onPress={this._download}>
        <View style={styles.button}>
          <Text>Download 5MB Text File</Text>
        </View>
      </TouchableHighlight>
    );

    let readystate = null;
    let progress = null;
    if (this.state.readystateHandler && !this.state.arraybuffer) {
      const { responseLength, contentLength } = this.state;
      readystate = (
        <View>
          <Text style={styles.progressBarLabel}>
            responseText:{' '}
            {roundKilo(responseLength)}/{roundKilo(contentLength)}k chars
          </Text>
          <ProgressBar
            progress={(responseLength / contentLength)}
          />
        </View>
      );
    }
    if (this.state.progressHandler) {
      const { progressLoaded, progressTotal } = this.state;
      progress = (
        <View>
          <Text style={styles.progressBarLabel}>
            onprogress:{' '}
            {roundKilo(progressLoaded)}/{roundKilo(progressTotal)} KB
          </Text>
          <ProgressBar
            progress={(progressLoaded / progressTotal)}
          />
        </View>
      );
    }

    return (
      <View>
        <View style={styles.configRow}>
          <Text>onreadystatechange handler</Text>
          <Switch
            value={this.state.readystateHandler}
            onValueChange={(readystateHandler => this.setState({readystateHandler}))}
          />
        </View>
        <View style={styles.configRow}>
          <Text>onprogress handler</Text>
          <Switch
            value={this.state.progressHandler}
            onValueChange={(progressHandler => this.setState({progressHandler}))}
          />
        </View>
        <View style={styles.configRow}>
          <Text>download as arraybuffer</Text>
          <Switch
            value={this.state.arraybuffer}
            onValueChange={(arraybuffer => this.setState({arraybuffer}))}
          />
        </View>
        {button}
        {readystate}
        {progress}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 8,
  },
  progressBarLabel: {
    marginTop: 12,
    marginBottom: 8,
  },
  configRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

module.exports = XHRExampleDownload;
