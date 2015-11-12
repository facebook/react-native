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
  StyleSheet,
  Text,
  View,
} = React;

var requireNativeComponent = require('requireNativeComponent');
var UpdatePropertiesExampleView = requireNativeComponent('UpdatePropertiesExampleView');
var FlexibleSizeExampleView = requireNativeComponent('FlexibleSizeExampleView');

class AppPropertiesUpdateExample extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Press the button to update the field below by passing new properties to the RN app.
        </Text>
        <UpdatePropertiesExampleView style={styles.nativeView}>
          <Text style={styles.text}>
            Error: This demo is accessible only from UIExplorer app
          </Text>
        </UpdatePropertiesExampleView>
      </View>
    );
  }
}

class RootViewSizeFlexibilityExample extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Press the button to resize it. On resize, RCTRootViewDelegate is notified. You can use it to handle content size updates.
        </Text>
        <FlexibleSizeExampleView style={styles.nativeView}>
          <Text style={styles.text}>
            Error: This demo is accessible only from UIExplorer app
          </Text>
        </FlexibleSizeExampleView>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  text: {
    marginBottom: 20
  },
  nativeView: {
    height: 140,
    width: 280
  }
});

exports.title = 'RCTRootView';
exports.description = 'Examples that show useful methods when embedding React Native in a native application';
exports.examples = [
{
  title: 'Updating app properties in runtime',
  render(): React.Component {
    return (
      <AppPropertiesUpdateExample/>
    );
  },
},
{
  title: 'RCTRootView\'s size flexibility',
  render(): React.Component {
    return (
      <RootViewSizeFlexibilityExample/>
    );
  },
}];
