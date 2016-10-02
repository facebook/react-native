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
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  AlertIOS,
  CameraRoll,
  Image,
  Linking,
  ProgressViewIOS,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} = ReactNative;

var XHRExampleHeaders = require('./XHRExampleHeaders');
var XHRExampleFetch = require('./XHRExampleFetch');
var XHRExampleOnTimeOut = require('./XHRExampleOnTimeOut');
var XHRExampleCookies = require('./XHRExampleCookies');

/**
 * Convert number of bytes to MB and round to the nearest 0.1 MB.
 */
function roundKilo(value: number): number {
  return Math.round(value / 1000);
}

class Downloader extends React.Component {
  state: any;

  xhr: XMLHttpRequest;
  cancelled: boolean;

  constructor(props) {
    super(props);
    this.cancelled = false;
    this.state = {
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
  }

  download() {
    this.xhr && this.xhr.abort();

    var xhr = this.xhr || new XMLHttpRequest();
    const onreadystatechange = () => {
      if (xhr.readyState === xhr.HEADERS_RECEIVED) {
        const contentLength = parseInt(xhr.getResponseHeader('Content-Length'), 10);
        this.setState({
          contentLength,
          responseLength: 0,
        });
      } else if (xhr.readyState === xhr.LOADING) {
        this.setState({
          responseLength: xhr.responseText.length,
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
        let responseType = `Response is a string, ${xhr.response.length} characters long.`;
        if (typeof ArrayBuffer !== 'undefined' &&
            xhr.response instanceof ArrayBuffer) {
          responseType = `Response is an ArrayBuffer, ${xhr.response.byteLength} bytes long.`;
        }
        alert(`Download complete! ${responseType}`);
      } else if (xhr.status !== 0) {
        alert('Error: Server returned HTTP status of ' + xhr.status + ' ' + xhr.responseText);
      } else {
        alert('Error: ' + xhr.responseText);
      }
    };
    xhr.open('GET', 'http://aleph.gutenberg.org/cache/epub/100/pg100.txt.utf8');
    xhr.send();
    this.xhr = xhr;

    this.setState({downloading: true});
  }


  componentWillUnmount() {
    this.cancelled = true;
    this.xhr && this.xhr.abort();
  }

  render() {
    var button = this.state.downloading ? (
      <View style={styles.wrapper}>
        <View style={styles.button}>
          <Text>Downloading...</Text>
        </View>
      </View>
    ) : (
      <TouchableHighlight
        style={styles.wrapper}
        onPress={this.download.bind(this)}>
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
          <ProgressViewIOS
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
          <ProgressViewIOS
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

var PAGE_SIZE = 20;

class FormUploader extends React.Component {
  state: any;

  _isMounted: boolean;
  _fetchRandomPhoto: () => void;
  _addTextParam: () => void;
  _upload: () => void;

  constructor(props) {
    super(props);
    this.state = {
      isUploading: false,
      uploadProgress: null,
      randomPhoto: null,
      textParams: [],
    };
    this._isMounted = true;
    this._fetchRandomPhoto = this._fetchRandomPhoto.bind(this);
    this._addTextParam = this._addTextParam.bind(this);
    this._upload = this._upload.bind(this);

    this._fetchRandomPhoto();
  }

  _fetchRandomPhoto() {
    CameraRoll.getPhotos(
      {first: PAGE_SIZE}
    ).then(
      (data) => {
        if (!this._isMounted) {
          return;
        }
        var edges = data.edges;
        var edge = edges[Math.floor(Math.random() * edges.length)];
        var randomPhoto = edge && edge.node && edge.node.image;
        if (randomPhoto) {
          this.setState({randomPhoto});
        }
      },
      (error) => undefined
    );
  }

  _addTextParam() {
    var textParams = this.state.textParams;
    textParams.push({name: '', value: ''});
    this.setState({textParams});
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _onTextParamNameChange(index, text) {
    var textParams = this.state.textParams;
    textParams[index].name = text;
    this.setState({textParams});
  }

  _onTextParamValueChange(index, text) {
    var textParams = this.state.textParams;
    textParams[index].value = text;
    this.setState({textParams});
  }

  _upload() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://posttestserver.com/post.php');
    xhr.onload = () => {
      this.setState({isUploading: false});
      if (xhr.status !== 200) {
        AlertIOS.alert(
          'Upload failed',
          'Expected HTTP 200 OK response, got ' + xhr.status
        );
        return;
      }
      if (!xhr.responseText) {
        AlertIOS.alert(
          'Upload failed',
          'No response payload.'
        );
        return;
      }
      var index = xhr.responseText.indexOf('http://www.posttestserver.com/');
      if (index === -1) {
        AlertIOS.alert(
          'Upload failed',
          'Invalid response payload.'
        );
        return;
      }
      var url = xhr.responseText.slice(index).split('\n')[0];
      Linking.openURL(url);
    };
    var formdata = new FormData();
    if (this.state.randomPhoto) {
      formdata.append('image', {...this.state.randomPhoto, name: 'image.jpg'});
    }
    this.state.textParams.forEach(
      (param) => formdata.append(param.name, param.value)
    );
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        this.setState({uploadProgress: event.loaded / event.total});
      }
    };

    xhr.send(formdata);
    this.setState({isUploading: true});
  }

  render() {
    var image = null;
    if (this.state.randomPhoto) {
      image = (
        <Image
          source={this.state.randomPhoto}
          style={styles.randomPhoto}
        />
      );
    }
    var textItems = this.state.textParams.map((item, index) => (
      <View style={styles.paramRow}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={this._onTextParamNameChange.bind(this, index)}
          placeholder="name..."
          style={styles.textInput}
        />
        <Text style={styles.equalSign}>=</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={this._onTextParamValueChange.bind(this, index)}
          placeholder="value..."
          style={styles.textInput}
        />
      </View>
    ));
    var uploadButtonLabel = this.state.isUploading ? 'Uploading...' : 'Upload';
    var uploadProgress = this.state.uploadProgress;
    if (uploadProgress !== null) {
      uploadButtonLabel += ' ' + Math.round(uploadProgress * 100) + '%';
    }
    var uploadButton = (
      <View style={styles.uploadButtonBox}>
        <Text style={styles.uploadButtonLabel}>{uploadButtonLabel}</Text>
      </View>
    );
    if (!this.state.isUploading) {
      uploadButton = (
        <TouchableHighlight onPress={this._upload}>
          {uploadButton}
        </TouchableHighlight>
      );
    }
    return (
      <View>
        <View style={styles.paramRow}>
          <Text style={styles.photoLabel}>
            Random photo from your library
            (<Text style={styles.textButton} onPress={this._fetchRandomPhoto}>
              update
            </Text>)
          </Text>
          {image}
        </View>
        {textItems}
        <View>
          <Text
            style={[styles.textButton, styles.addTextParamButton]}
            onPress={this._addTextParam}>
            Add a text param
          </Text>
        </View>
        <View style={styles.uploadButton}>
          {uploadButton}
        </View>
      </View>
    );
  }
}

exports.framework = 'React';
exports.title = 'XMLHttpRequest';
exports.description = 'XMLHttpRequest';
exports.examples = [{
  title: 'File Download',
  render() {
    return <Downloader/>;
  }
}, {
  title: 'multipart/form-data Upload',
  render() {
    return <FormUploader/>;
  }
}, {
  title: 'Fetch Test',
  render() {
    return <XHRExampleFetch/>;
  }
}, {
  title: 'Headers',
  render() {
    return <XHRExampleHeaders/>;
  }
}, {
  title: 'Time Out Test',
  render() {
    return <XHRExampleOnTimeOut/>;
  }
}, {
  title: 'Cookies',
  render() {
    return <XHRExampleCookies />;
  }
}];

var styles = StyleSheet.create({
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
  paramRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'grey',
  },
  photoLabel: {
    flex: 1,
  },
  randomPhoto: {
    width: 50,
    height: 50,
  },
  textButton: {
    color: 'blue',
  },
  addTextParamButton: {
    marginTop: 8,
  },
  textInput: {
    flex: 1,
    borderRadius: 3,
    borderColor: 'grey',
    borderWidth: 1,
    height: 30,
    paddingLeft: 8,
  },
  equalSign: {
    paddingHorizontal: 4,
  },
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
