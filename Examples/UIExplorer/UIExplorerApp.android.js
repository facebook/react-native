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
 * @providesModule UIExplorerApp
 * @flow
 */
'use strict';

var React = require('react-native');
var Dimensions = require('Dimensions');
var DrawerLayoutAndroid = require('DrawerLayoutAndroid');
var ToolbarAndroid = require('ToolbarAndroid');
var UIExplorerList = require('./UIExplorerList');
var {
  StyleSheet,
  View,
} = React;

var DRAWER_WIDTH_LEFT = 56;

var UIExplorerApp = React.createClass({

  getInitialState: function() {
    return {
      example: {
        title: 'UIExplorer',
        component: this._renderHome(),
      },
    };
  },

  render: function() {
    return (
      <DrawerLayoutAndroid
        drawerPosition={DrawerLayoutAndroid.positions.Left}
        drawerWidth={Dimensions.get('window').width - DRAWER_WIDTH_LEFT}
        ref={(drawer) => { this.drawer = drawer; }}
        renderNavigationView={this._renderNavigationView}>
        {this._renderNavigation()}
      </DrawerLayoutAndroid>
      );
  },

  _renderNavigationView: function() {
    return (
      <UIExplorerList
        onSelectExample={this.onSelectExample}
        isInDrawer={true}
      />
    );
  },

  onSelectExample: function(example) {
    this.drawer.closeDrawer();
    if (example.title === 'UIExplorer') {
      example.component = this._renderHome();
    }
    this.setState({
      example: {
        title: example.title,
        component: example.component,
      },
    });
  },

  _renderHome: function() {
    var onSelectExample = this.onSelectExample;
    return React.createClass({
      render: function() {
        return (
          <UIExplorerList
            onSelectExample={onSelectExample}
            isInDrawer={false}
          />
        );
      }
    });
  },

  _renderNavigation: function() {
    var Component = this.state.example.component;
    return (
      <View style={styles.container}>
        <ToolbarAndroid
          logo={require('image!launcher_icon')}
          navIcon={require('image!ic_menu_black_24dp')}
          onIconClicked={() => this.drawer.openDrawer()}
          style={styles.toolbar}
          title={this.state.example.title}
        />
        <Component />
      </View>
    );
  },

});

var styles = StyleSheet.create({
  messageText: {
    fontSize: 17,
    fontWeight: '500',
    padding: 15,
    marginTop: 50,
    marginLeft: 15,
  },
  container: {
    flex: 1,
  },
  toolbar: {
    backgroundColor: '#E9EAED',
    height: 56,
  },
});

module.exports = UIExplorerApp;
