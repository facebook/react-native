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
 * @providesModule XHRExampleBinaryUpload
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  Alert,
  Linking,
  Picker,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = ReactNative;

const BINARY_TYPES = {
  String,
  ArrayBuffer,
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  DataView,
};

const SAMPLE_TEXT = `
I am the spirit that negates.
And rightly so, for all that comes to be
Deserves to perish wretchedly;
'Twere better nothing would begin.
Thus everything that that your terms, sin,
Destruction, evil represent—
That is my proper element.

--Faust, JW Goethe
`;


class XHRExampleBinaryUpload extends React.Component {

  static handlePostTestServerUpload(xhr: XMLHttpRequest) {
    if (xhr.status !== 200) {
      Alert.alert(
        'Upload failed',
        'Expected HTTP 200 OK response, got ' + xhr.status
      );
      return;
    }
    if (!xhr.responseText) {
      Alert.alert(
        'Upload failed',
        'No response payload.'
      );
      return;
    }
    var index = xhr.responseText.indexOf('http://www.posttestserver.com/');
    if (index === -1) {
      Alert.alert(
        'Upload failed',
        'Invalid response payload.'
      );
      return;
    }
    var url = xhr.responseText.slice(index).split('\n')[0];
    console.log('Upload successful: ' + url);
    Linking.openURL(url);
  }

  state = {
    type: 'Uint8Array',
  };

  _upload = () => {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://posttestserver.com/post.php');
    xhr.onload = () => XHRExampleBinaryUpload.handlePostTestServerUpload(xhr);
    xhr.setRequestHeader('Content-Type', 'text/plain');

    if (this.state.type === 'String') {
      xhr.send(SAMPLE_TEXT);
      return;
    }

    const arrayBuffer = new ArrayBuffer(256);
    const asBytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < SAMPLE_TEXT.length; i++) {
      asBytes[i] = SAMPLE_TEXT.charCodeAt(i);
    }
    if (this.state.type === 'ArrayBuffer') {
      xhr.send(arrayBuffer);
      return;
    }
    if (this.state.type === 'Uint8Array') {
      xhr.send(asBytes);
      return;
    }

    const TypedArrayClass = BINARY_TYPES[this.state.type];
    xhr.send(new TypedArrayClass(arrayBuffer));
  };

  render() {
    return (
      <View>
        <Text>Upload 255 bytes as...</Text>
        <Picker
          selectedValue={this.state.type}
          onValueChange={(type) => this.setState({type})}>
          {Object.keys(BINARY_TYPES).map((type) => (
            <Picker.Item key={type} label={type} value={type} />
          ))}
        </Picker>
        <View style={styles.uploadButton}>
          <TouchableHighlight onPress={this._upload}>
            <View style={styles.uploadButtonBox}>
              <Text style={styles.uploadButtonLabel}>Upload</Text>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    );
  }

}

const styles = StyleSheet.create({
  uploadButton: {
    marginTop: 16,
  },
  uploadButtonBox: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'blue',
    borderRadius: 4,
  },
  uploadButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

module.exports = XHRExampleBinaryUpload;
