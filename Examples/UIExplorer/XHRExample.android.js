/**
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

var React = require('react-native');
var {
  ProgressBarAndroid,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} = React;

var XHRExampleHeaders = require('./XHRExampleHeaders');
var XHRExampleCookies = require('./XHRExampleCookies');
var XHRExampleFetch = require('./XHRExampleFetch');


// TODO t7093728 This is a simplified XHRExample.ios.js.
// Once we have Camera roll, Toast, Intent (for opening URLs)
// we should make this consistent with iOS.

class Downloader extends React.Component {

  xhr: XMLHttpRequest;
  cancelled: boolean;

  constructor(props) {
    super(props);
    this.cancelled = false;
    this.state = {
      status: '',
      contentSize: 1,
      downloaded: 0,
    };
  }

  download() {
    this.xhr && this.xhr.abort();

    var xhr = this.xhr || new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.HEADERS_RECEIVED) {
        var contentSize = parseInt(xhr.getResponseHeader('Content-Length'), 10);
        this.setState({
          contentSize: contentSize,
          downloaded: 0,
        });
      } else if (xhr.readyState === xhr.LOADING) {
        this.setState({
          downloaded: xhr.responseText.length,
        });
      } else if (xhr.readyState === xhr.DONE) {
        if (this.cancelled) {
          this.cancelled = false;
          return;
        }
        if (xhr.status === 200) {
          this.setState({
            status: 'Download complete!',
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
    xhr.open('GET', 'http://www.gutenberg.org/cache/epub/100/pg100.txt');
    // Avoid gzip so we can actually show progress
    xhr.setRequestHeader('Accept-Encoding', '');
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
         <Text>Download 5MB Text File</Text>
        </View>
      </TouchableHighlight>
    );

    return (
      <View>
        {button}
        <ProgressBarAndroid progress={(this.state.downloaded / this.state.contentSize)}
          styleAttr="Horizontal" indeterminate={false} />
        <Text>{this.state.status}</Text>
      </View>
    );
  }
}

class FormUploader extends React.Component {

  _isMounted: boolean;
  _addTextParam: () => void;
  _upload: () => void;

  constructor(props) {
    super(props);
    this.state = {
      isUploading: false,
      uploadProgress: null,
      textParams: [],
    };
    this._isMounted = true;
    this._addTextParam = this._addTextParam.bind(this);
    this._upload = this._upload.bind(this);
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
        console.log(
          'Upload failed',
          'Expected HTTP 200 OK response, got ' + xhr.status
        );
        return;
      }
      if (!xhr.responseText) {
        console.log(
          'Upload failed',
          'No response payload.'
        );
        return;
      }
      var index = xhr.responseText.indexOf('http://www.posttestserver.com/');
      if (index === -1) {
        console.log(
          'Upload failed',
          'Invalid response payload.'
        );
        return;
      }
      var url = xhr.responseText.slice(index).split('\n')[0];
      console.log('Upload successful: ' + url);
    };
    var formdata = new FormData();
    this.state.textParams.forEach(
      (param) => formdata.append(param.name, param.value)
    );
    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        console.log('upload onprogress', event);
        if (event.lengthComputable) {
          this.setState({uploadProgress: event.loaded / event.total});
        }
      };
    }
    xhr.send(formdata);
    this.setState({isUploading: true});
  }

  render() {
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
exports.description = 'Example that demonstrates upload and download requests ' +
  'using XMLHttpRequest.';
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
  title: 'Cookies',
  render() {
    return <XHRExampleCookies/>;
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
  paramRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'grey',
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
