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
*/
'use strict';

var React = require('react-native');
var {
  Text,
  PixelRatio,
  StyleSheet,
  View,
  TouchableHighlight,
} = React;

var NavigationExampleRow = React.createClass({
  propTypes: {
    darkMode: React.PropTypes.bool,
  },

  getDefaultProps: function() {
    return {
      darkMode: false,
    };
  },

  render: function() {
    if (this.props.onPress) {
      return (
        <TouchableHighlight
          style={[styles.row, this.props.darkMode && styles.rowDark]}
          underlayColor="#D0D0D0"
          onPress={this.props.onPress}>
          <Text style={[styles.rowText, this.props.darkMode && styles.rowTextDark]}>
            {this.props.text}
          </Text>
        </TouchableHighlight>
      );
    }
    return (
      <View style={[styles.row, this.props.darkMode && styles.rowDark]}>
        <Text style={[styles.rowText, this.props.darkMode && styles.rowTextDark]}>
          {this.props.text}
        </Text>
      </View>
    );
  },
});

const styles = StyleSheet.create({
  row: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1 / PixelRatio.get(),
    borderBottomColor: '#CDCDCD',
  },
  rowDark: {
    backgroundColor: '#4C555C',
    borderBottomColor: '#A1B4C4',
  },
  rowText: {
    fontSize: 17,
  },
  rowTextDark: {
    color: 'white',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '500',
  },
});

module.exports = NavigationExampleRow;
