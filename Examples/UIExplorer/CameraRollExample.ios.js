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
  CameraRoll,
  Image,
  SliderIOS,
  StyleSheet,
  SwitchIOS,
  Text,
  View,
} = React;

var CameraRollView = require('./CameraRollView.ios');

var CAMERA_ROLL_VIEW = 'camera_roll_view';

var CameraRollExample = React.createClass({

  getInitialState() {
    return {
      groupTypes: 'SavedPhotos',
      sliderValue: 1,
      bigImages: true,
    };
  },

  render() {
    return (
      <View>
        <SwitchIOS
          onValueChange={this._onSwitchChange}
          value={this.state.bigImages} />
        <Text>{(this.state.bigImages ? 'Big' : 'Small') + ' Images'}</Text>
        <SliderIOS
          value={this.state.sliderValue}
          onValueChange={this._onSliderChange}
        />
        <Text>{'Group Type: ' + this.state.groupTypes}</Text>
        <CameraRollView
          ref={CAMERA_ROLL_VIEW}
          batchSize={5}
          groupTypes={this.state.groupTypes}
          renderImage={this._renderImage}
        />
      </View>
    );
  },

  _renderImage(asset) {
    var imageSize = this.state.bigImages ? 150 : 75;
    var imageStyle = [styles.image, {width: imageSize, height: imageSize}];
    var location = asset.node.location.longitude ?
      JSON.stringify(asset.node.location) : 'Unknown location';
    return (
      <View key={asset} style={styles.row}>
        <Image
          source={asset.node.image}
          style={imageStyle}
        />
        <View style={styles.info}>
          <Text style={styles.url}>{asset.node.image.uri}</Text>
          <Text>{location}</Text>
          <Text>{asset.node.group_name}</Text>
          <Text>{new Date(asset.node.timestamp).toString()}</Text>
        </View>
      </View>
    );
  },

  _onSliderChange(value) {
    var options = CameraRoll.GroupTypesOptions;
    var index = Math.floor(value * options.length * 0.99);
    var groupTypes = options[index];
    if (groupTypes !== this.state.groupTypes) {
      this.setState({groupTypes: groupTypes});
    }
  },

  _onSwitchChange(value) {
    this.refs[CAMERA_ROLL_VIEW].rendererChanged();
    this.setState({ bigImages: value });
  }
});

var styles = StyleSheet.create({
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

exports.title = '<CameraRollView>';
exports.description = 'Example component that uses CameraRoll to list user\'s photos';
exports.examples = [
  {
    title: 'Photos',
    render(): ReactElement { return <CameraRollExample />; }
  }
];
