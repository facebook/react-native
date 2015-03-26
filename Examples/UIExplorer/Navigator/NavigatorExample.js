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
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
} = React;
var BreadcrumbNavSample = require('./BreadcrumbNavSample');
var NavigationBarSample = require('./NavigationBarSample');
var JumpingNavSample = require('./JumpingNavSample');

class NavMenu extends React.Component {
  render() {
    return (
      <ScrollView style={styles.scene}>
        <TouchableHighlight style={styles.button} onPress={() => {
          this.props.navigator.push({ id: 'breadcrumbs' });
        }}>
          <Text style={styles.buttonText}>Breadcrumbs Example</Text>
        </TouchableHighlight>
        <TouchableHighlight style={styles.button} onPress={() => {
          this.props.navigator.push({ id: 'navbar' });
        }}>
          <Text style={styles.buttonText}>Navbar Example</Text>
        </TouchableHighlight>
        <TouchableHighlight style={styles.button} onPress={() => {
          this.props.navigator.push({ id: 'jumping' });
        }}>
          <Text style={styles.buttonText}>Jumping Example</Text>
        </TouchableHighlight>
        <TouchableHighlight style={styles.button} onPress={() => {
          this.props.onExampleExit();
        }}>
          <Text style={styles.buttonText}>Exit Navigator Example</Text>
        </TouchableHighlight>
      </ScrollView>
    );
  }
}

var TabBarExample = React.createClass({

  statics: {
    title: '<Navigator>',
    description: 'JS-implemented navigation',
  },

  renderScene: function(route, nav) {
    switch (route.id) {
      case 'menu':
        return (
          <NavMenu
            navigator={nav}
            onExampleExit={this.props.onExampleExit}
          />
        );
      case 'navbar':
        return <NavigationBarSample />;
      case 'breadcrumbs':
        return <BreadcrumbNavSample />;
      case 'jumping':
        return <JumpingNavSample />;
    }
  },

  render: function() {
    return (
      <Navigator
        style={styles.container}
        initialRoute={{ id: 'menu', }}
        renderScene={this.renderScene}
        configureScene={(route) => Navigator.SceneConfigs.FloatFromBottom}
      />
    );
  },

});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
  },
  buttonText: {
  },
  scene: {
    flex: 1,
    paddingTop: 64,
  }
});

module.exports = TabBarExample;
