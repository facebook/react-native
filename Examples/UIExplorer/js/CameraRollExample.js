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
 * @providesModule CameraRollExample
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  CameraRoll,
  Image,
  Slider,
  StyleSheet,
  Switch,
  Text,
  View,
  TouchableOpacity
} = ReactNative;

const invariant = require('fbjs/lib/invariant');

const CameraRollView = require('./CameraRollView');

const AssetScaledImageExampleView = require('./AssetScaledImageExample');

class CameraRollExample extends React.Component {
  state = {
    groupTypes: 'SavedPhotos',
    sliderValue: 1,
    bigImages: true,
  };
  _cameraRollView: ?CameraRollView;
  render() {
    return (
      <View>
        <Switch
          onValueChange={this._onSwitchChange}
          value={this.state.bigImages}
        />
        <Text>{(this.state.bigImages ? 'Big' : 'Small') + ' Images'}</Text>
        <Slider
          value={this.state.sliderValue}
          onValueChange={this._onSliderChange}
        />
        <Text>{'Group Type: ' + this.state.groupTypes}</Text>
        <CameraRollView
          ref={(ref) => { this._cameraRollView = ref; }}
          batchSize={20}
          groupTypes={this.state.groupTypes}
          renderImage={this._renderImage}
        />
      </View>
    );
  }

  loadAsset = (asset) => {
    if (this.props.navigator) {
      this.props.navigator.push({
        title: 'Camera Roll Image',
        component: AssetScaledImageExampleView,
        backButtonTitle: 'Back',
        passProps: { asset: asset },
      });
    }
  };

  _renderImage = (asset) => {
    const imageSize = this.state.bigImages ? 150 : 75;
    const imageStyle = [styles.image, {width: imageSize, height: imageSize}];
    const {location} = asset.node;
    const locationStr = location ? JSON.stringify(location) : 'Unknown location';
    return (
      <TouchableOpacity key={asset} onPress={ this.loadAsset.bind( this, asset ) }>
        <View style={styles.row}>
          <Image
            source={asset.node.image}
            style={imageStyle}
          />
          <View style={styles.info}>
            <Text style={styles.url}>{asset.node.image.uri}</Text>
            <Text>{locationStr}</Text>
            <Text>{asset.node.group_name}</Text>
            <Text>{new Date(asset.node.timestamp).toString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  _onSliderChange = (value) => {
    const options = CameraRoll.GroupTypesOptions;
    const index = Math.floor(value * options.length * 0.99);
    const groupTypes = options[index];
    if (groupTypes !== this.state.groupTypes) {
      this.setState({groupTypes: groupTypes});
    }
  };

  _onSwitchChange = (value) => {
    invariant(this._cameraRollView, 'ref should be set');
    this._cameraRollView.rendererChanged();
    this.setState({ bigImages: value });
  };
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  url: {
    fontSize: 9,
    marginBottom: 14,
  },
  image: {
    margin: 4,
  },
  info: {
    flex: 1,
  },
});

exports.title = 'Camera Roll';
exports.description = 'Example component that uses CameraRoll to list user\'s photos';
exports.examples = [
  {
    title: 'Photos',
    render(): React.Element<any> { return <CameraRollExample />; }
  }
];
