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

const React = require('react');
const ReactNative = require('react-native');
const {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = ReactNative;

class UIExplorerHeaderWindows extends React.Component {
  constuctor(props: {
    title: ?string,
    onPress: Function,
    style: ?any,
  }) {
      
  }
  render(): ?ReactElement {
    return (
      <View style={[styles.header, this.props.style]}>
        <TouchableHighlight
          onPress={this.props.onPress}
          style={[styles.button]}>
          <Text
            style={[styles.menu]}>
            Menu
          </Text>
        </TouchableHighlight>
        <View style={[styles.titleContainer]}>
          <Text style={[styles.title]}>{this.props.title}</Text>
        </View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: 'blue',
    height: 36,
    padding: 8,
  },
  menu: {
    color: 'white',
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    padding: 6,
  },
  title: {
    fontSize: 17,      
    fontWeight: '500',
  },
});

module.exports = UIExplorerHeaderWindows;
