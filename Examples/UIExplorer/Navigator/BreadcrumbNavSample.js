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
  PixelRatio,
  Navigator,
  StyleSheet,
  ScrollView,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} = React;

var _getRandomRoute = function() {
  return {
    title: '#' + Math.ceil(Math.random() * 1000),
  };
};

class NavButton extends React.Component {
  render() {
    return (
      <TouchableHighlight
        style={styles.button}
        underlayColor="#B5B5B5"
        onPress={this.props.onPress}>
        <Text style={styles.buttonText}>{this.props.text}</Text>
      </TouchableHighlight>
    );
  }
}

var BreadcrumbNavSample = React.createClass({

  componentWillMount: function() {
    this._navBarRouteMapper = {
      rightContentForRoute: function(route, navigator) {
        return null;
      },
      titleContentForRoute: function(route, navigator) {
        return (
          <TouchableOpacity
            onPress={() => navigator.push(_getRandomRoute())}>
            <View>
              <Text style={styles.titleText}>{route.title}</Text>
            </View>
          </TouchableOpacity>
        );
      },
      iconForRoute: function(route, navigator) {
        return (
          <TouchableOpacity onPress={() => {
            navigator.popToRoute(route);
          }}>
            <View style={styles.crumbIconPlaceholder} />
          </TouchableOpacity>
        );
      },
      separatorForRoute: function(route, navigator) {
        return (
          <TouchableOpacity onPress={navigator.pop}>
            <View style={styles.crumbSeparatorPlaceholder} />
          </TouchableOpacity>
        );
      }
    };
  },

  _renderScene: function(route, navigator) {
    return (
      <ScrollView style={styles.scene}>
        <NavButton
          onPress={() => { navigator.push(_getRandomRoute()) }}
          text="Push"
        />
        <NavButton
          onPress={() => { navigator.immediatelyResetRouteStack([_getRandomRoute(), _getRandomRoute()]) }}
          text="Reset w/ 2 scenes"
        />
        <NavButton
          onPress={() => { navigator.popToTop() }}
          text="Pop to top"
        />
        <NavButton
          onPress={() => { navigator.replace(_getRandomRoute()) }}
          text="Replace"
        />
        <NavButton
          onPress={() => { this.props.navigator.pop(); }}
          text="Close breadcrumb example"
        />
      </ScrollView>
    );
  },

  render: function() {
    return (
      <Navigator
        style={styles.container}
        initialRoute={_getRandomRoute()}
        renderScene={this._renderScene}
        navigationBar={
          <Navigator.BreadcrumbNavigationBar
            routeMapper={this._navBarRouteMapper}
          />
        }
      />
    );
  },



});

var styles = StyleSheet.create({
  scene: {
    paddingTop: 50,
    flex: 1,
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1 / PixelRatio.get(),
    borderBottomColor: '#CDCDCD',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  container: {
    overflow: 'hidden',
    backgroundColor: '#dddddd',
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 32,
  },
  crumbIconPlaceholder: {
    flex: 1,
    backgroundColor: '#666666',
  },
  crumbSeparatorPlaceholder: {
    flex: 1,
    backgroundColor: '#aaaaaa',
  },
});

module.exports = BreadcrumbNavSample;
