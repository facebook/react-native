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

var React = require('react');
var ReactNative = require('react-native');
var {
  NavigatorIOS,
  StatusBar,
  StyleSheet,
  Text,
  View
} = ReactNative;

var EmptyPage = React.createClass({

  render: function() {
    return (
      <View style={styles.emptyPage}>
        <Text style={styles.emptyPageText}>
          {this.props.text}
        </Text>
      </View>
    );
  },

});

var NavigatorIOSColors = React.createClass({

  statics: {
    title: '<NavigatorIOS> - Custom',
    description: 'iOS navigation with custom nav bar colors',
  },

  render: function() {
    // Set StatusBar with light contents to get better contrast
    StatusBar.setBarStyle('light-content');

    return (
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          component: EmptyPage,
          title: '<NavigatorIOS>',
          rightButtonTitle: 'Done',
          onRightButtonPress: () => {
            StatusBar.setBarStyle('default');
            this.props.onExampleExit();
          },
          passProps: {
            text: 'The nav bar has custom colors with tintColor, ' +
              'barTintColor and titleTextColor props.',
          },
        }}
        tintColor="#FFFFFF"
        barTintColor="#183E63"
        titleTextColor="#FFFFFF"
        translucent={true}
      />
    );
  },

});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyPage: {
    flex: 1,
    paddingTop: 64,
  },
  emptyPageText: {
    margin: 10,
  },
});

NavigatorIOSColors.external = true;

module.exports = NavigatorIOSColors;
