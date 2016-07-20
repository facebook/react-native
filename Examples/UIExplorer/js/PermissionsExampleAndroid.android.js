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
 * @providesModule PermissionsExampleAndroid
 * @flow
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} = ReactNative;
const DialogManager = require('NativeModules').DialogManagerAndroid;
const Permissions = require('NativeModules').AndroidPermissions;

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = '<Permissions>';
exports.description = 'Permissions example for API 23+.';

const PermissionsExample = React.createClass({
  getInitialState: function() {
    return {
      permission: 'android.permission.WRITE_EXTERNAL_STORAGE',
      hasPermission: 'Not Checked',
    };
  },

  render: function() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Permission Name:</Text>
        <TextInput
          autoFocus={true}
          autoCorrect={false}
          style={styles.singleLine}
          onChange={this._updateText}
          defaultValue={this.state.permission}
        />
        <TouchableWithoutFeedback onPress={this._checkPermission}>
          <View>
            <Text style={[styles.touchable, styles.text]}>Check Permission</Text>
          </View>
        </TouchableWithoutFeedback>
        <Text style={styles.text}>Permission Status: {this.state.hasPermission}</Text>
        <TouchableWithoutFeedback onPress={this._shouldExplainPermission}>
          <View>
            <Text style={[styles.touchable, styles.text]}>Request Permission</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  },

  _updateText: function(event: Object) {
    this.setState({
      permission: event.nativeEvent.text,
    });
  },

  _checkPermission: function() {
    Permissions.checkPermission(
      this.state.permission,
      (permission: string, result: boolean) => {
        this.setState({
          hasPermission: (result ? 'Granted' : 'Revoked') + ' for ' + permission,
        });
      },
      this._showError);
  },

  _shouldExplainPermission: function() {
    Permissions.shouldShowRequestPermissionRationale(
      this.state.permission,
      (permission: string, shouldShow: boolean) => {
        if (shouldShow) {
          DialogManager.showAlert(
            {
              title: 'Permission Explanation',
              message:
                'The app needs the following permission ' + this.state.permission +
                ' because of reasons. Please approve.'
            },
            this._showError,
            this._requestPermission);
        } else {
          this._requestPermission();
        }
      },
      this._showError);
  },

  _requestPermission: function() {
    Permissions.requestPermission(
      this.state.permission,
      (permission: string, result: boolean) => {
        this.setState({
          hasPermission: (result ? 'Granted' : 'Revoked') + ' for ' + permission,
        });
      },
      this._showError);
  },

  _showError: function() {
    DialogManager.showAlert({message: 'Error'}, {}, {});
  }
});

exports.examples = [
  {
    title: 'Permissions Example',
    description: 'Short example of how to use the runtime permissions API introduced in Android M.',
    render: () => <PermissionsExample />,
  },
];

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  singleLine: {
    fontSize: 16,
    padding: 4,
  },
  text: {
    margin: 10,
  },
  touchable: {
    color: '#007AFF',
  },
});

