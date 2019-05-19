/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} = require('react-native');

const XHRExampleBinaryUpload = require('./XHRExampleBinaryUpload');

class XHRExampleFormData extends React.Component<Object, Object> {
  state: Object = {
    isUploading: false,
    uploadProgress: null,
    randomPhoto: null,
    textParams: [],
  };

  _isMounted: boolean = true;

  constructor(props: Object) {
    super(props);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _addTextParam = () => {
    const textParams = this.state.textParams;
    textParams.push({name: '', value: ''});
    this.setState({textParams});
  };

  _onTextParamNameChange(index, text) {
    const textParams = this.state.textParams;
    textParams[index].name = text;
    this.setState({textParams});
  }

  _onTextParamValueChange(index, text) {
    const textParams = this.state.textParams;
    textParams[index].value = text;
    this.setState({textParams});
  }

  _upload = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://posttestserver.com/post.php');
    xhr.onload = () => {
      this.setState({isUploading: false});
      XHRExampleBinaryUpload.handlePostTestServerUpload(xhr);
    };
    const formdata = new FormData();
    this.state.textParams.forEach(param =>
      formdata.append(param.name, param.value),
    );
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) {
        this.setState({uploadProgress: event.loaded / event.total});
      }
    };

    xhr.send(formdata);
    this.setState({isUploading: true});
  };

  render() {
    const textItems = this.state.textParams.map((item, index) => (
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
    let uploadButtonLabel = this.state.isUploading ? 'Uploading...' : 'Upload';
    const uploadProgress = this.state.uploadProgress;
    if (uploadProgress !== null) {
      uploadButtonLabel += ' ' + Math.round(uploadProgress * 100) + '%';
    }
    let uploadButton = (
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
        <View style={styles.uploadButton}>{uploadButton}</View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
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
    height: Platform.OS === 'android' ? 50 : 30,
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

module.exports = XHRExampleFormData;
