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
  Navigator,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;

var cssVar = require('cssVar');


var NavigationBarRouteMapper = {

  LeftButton: function(route, navigator, index, navState) {
    if (index === 0) {
      return null;
    }

    var previousRoute = navState.routeStack[index - 1];
    return (
      <TouchableHighlight onPress={() => navigator.pop()}>
        <View>
          <Text style={[styles.navBarText, styles.navBarButtonText]}>
            {previousRoute.title}
          </Text>
        </View>
      </TouchableHighlight>
    );
  },

  RightButton: function(route, navigator, index, navState) {
    return (
      <TouchableHighlight
        onPress={() => navigator.push(newRandomRoute())}>
        <View>
          <Text style={[styles.navBarText, styles.navBarButtonText]}>
            Next
          </Text>
        </View>
      </TouchableHighlight>
    );
  },

  Title: function(route, navigator, index, navState) {
    return (
      <Text style={[styles.navBarText, styles.navBarTitleText]}>
        {route.title} [{index}]
      </Text>
    );
  },

};

function newRandomRoute() {
  return {
    content: 'Hello World!',
    title: 'Random ' + Math.round(Math.random() * 100),
  };
}

var NavigationBarSample = React.createClass({

  render: function() {
    return (
      <View style={styles.appContainer}>
        <Navigator
          debugOverlay={false}
          style={styles.appContainer}
          initialRoute={newRandomRoute()}
          renderScene={(route, navigator) => (
            <View style={styles.scene}>
              <Text>{route.content}</Text>
            </View>
          )}
          navigationBar={
            <Navigator.NavigationBar
              navigationBarRouteMapper={NavigationBarRouteMapper}
            />
          }
        />
      </View>
    );
  },

});

var styles = StyleSheet.create({
  appContainer: {
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    flex: 1,
  },
  scene: {
    paddingTop: 50,
    flex: 1,
  },
  navBarText: {
    fontSize: 16,
    marginVertical: 10,
  },
  navBarTitleText: {
    color: cssVar('fbui-bluegray-60'),
    fontWeight: '500',
    marginVertical: 9,
  },
  navBarButtonText: {
    color: cssVar('fbui-accent-blue'),
  },
});

module.exports = NavigationBarSample;
