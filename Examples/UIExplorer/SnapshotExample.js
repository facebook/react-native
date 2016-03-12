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
  Image,
  StyleSheet,
  Text,
  UIManager,
  View,
} = React;

var ScreenshotExample = React.createClass({
  getInitialState() {
    return {
      uri: undefined,
    };
  },

  render() {
    return (
      <View style={style.root} ref={ref => this._view = ref}>
        <Image
          source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
          style={style.image}
        />
        <Text onPress={this.takeScreenshot} style={style.button}>
          Click here to screenshot the App (JPG 50%)
        </Text>
        <Text onPress={this.takeScreenshot2} style={style.button}>
          Click here to screenshot this View (PNG)
        </Text>

        <Image style={style.result} source={{uri: this.state.uri}}/>
      </View>
    );
  },

  takeScreenshot() {
    UIManager
      .takeSnapshot('window', {format: 'jpeg', quality: 0.5 }) // See UIManager.js for options
      .then((uri) => this.setState({uri}))
      .catch((error) => alert(error));
  },

  takeScreenshot2() {
    UIManager
      .takeSnapshot(this._view)
      .then((uri) => this.setState({uri}))
      .catch((error) => alert(error));
  }
});

var style = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    position: 'relative',
  },
  button: {
    margin: 5,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  image: {
    width: 40,
    height: 40,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  result: {
    flex: 1,
    height: 300,
    resizeMode: 'contain',
    backgroundColor: 'black',
  },
});

exports.title = 'Snapshot / Screenshot';
exports.description = 'API to capture images from the screen.';
exports.examples = [
  {
    title: 'Take screenshot',
    render(): ReactElement { return <ScreenshotExample />; }
  },
];
