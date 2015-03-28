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
  View,
  Text,
  TouchableHighlight,
  StatusBarIOS,
} = React;

exports.framework = 'React';
exports.title = 'StatusBarIOS';
exports.description = 'Module for controlling iOS status bar';
exports.examples = [{
  title: 'Status Bar Style',
  render() {
    return (
      <View>
        {Object.keys(StatusBarIOS.Style).map((key) =>
          <TouchableHighlight style={styles.wrapper}
            onPress={() => StatusBarIOS.setStyle(StatusBarIOS.Style[key])}>
            <View style={styles.button}>
              <Text>setStyle(StatusBarIOS.Style.{key})</Text>
            </View>
          </TouchableHighlight>
        )}
      </View>
    );
  },
}, {
  title: 'Status Bar Style Animated',
  render() {
    return (
      <View>
        {Object.keys(StatusBarIOS.Style).map((key) =>
          <TouchableHighlight style={styles.wrapper}
            onPress={() => StatusBarIOS.setStyle(StatusBarIOS.Style[key], true)}>
            <View style={styles.button}>
              <Text>setStyle(StatusBarIOS.Style.{key}, true)</Text>
            </View>
          </TouchableHighlight>
        )}
      </View>
    );
  },
}, {
  title: 'Status Bar Hidden',
  render() {
    return (
      <View>
        {Object.keys(StatusBarIOS.Animation).map((key) =>
          <View>
            <TouchableHighlight style={styles.wrapper}
              onPress={() => StatusBarIOS.setHidden(true, StatusBarIOS.Animation[key])}>
              <View style={styles.button}>
                <Text>setHidden(true, StatusBarIOS.Animation.{key})</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={styles.wrapper}
              onPress={() => StatusBarIOS.setHidden(false, StatusBarIOS.Animation[key])}>
              <View style={styles.button}>
                <Text>setHidden(false, StatusBarIOS.Animation.{key})</Text>
              </View>
            </TouchableHighlight>
          </View>
        )}
      </View>
    );
  },
}];

var styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
});
