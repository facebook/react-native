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
var UIExplorerList = require('./UIExplorerList.ios');
var {
  AppRegistry,
  NavigatorIOS,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  StatusBar,
} = React;

var UIExplorerApp = React.createClass({

  getInitialState: function() {
    return {
      openExternalExample: (null: ?React.Component),
    };
  },

  render: function() {
    if (this.state.openExternalExample) {
      var Example = this.state.openExternalExample;
      return (
        <Example
          onExampleExit={() => {
            this.setState({ openExternalExample: null, });
          }}
        />
      );
    }

    return (
      <View style={{flex: 1}}>
        <StatusBar barStyle="default" />
        <NavigatorIOS
          style={styles.container}
          initialRoute={{
            title: 'UIExplorer',
            component: UIExplorerList,
            passProps: {
              onExternalExampleRequested: (example) => {
                this.setState({ openExternalExample: example, });
              },
            }
          }}
          itemWrapperStyle={styles.itemWrapper}
          tintColor="#008888"
        />
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemWrapper: {
    backgroundColor: '#eaeaea',
  },
  bigContainer: {
    flex: 1,
    height: 60,
    backgroundColor: 'gray',
  },
  smallContainer: {
    flex: 1,
    height: 40,
    backgroundColor: 'gray',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: 'white',
  }
});

var SetPropertiesExampleApp = React.createClass({

  render: function() {
    var wrapperStyle = {
      backgroundColor: this.props.color,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    };

    return (
      <View style={wrapperStyle}>
        <Text>
          Embedded React Native view
        </Text>
      </View>
    );
  },
});

var RootViewSizeFlexibilityExampleApp = React.createClass({

  getInitialState: function () {
    return { toggled: false };
  },

  _onPressButton: function() {
    this.setState({ toggled: !this.state.toggled });
  },

  render: function() {
    var viewStyle = this.state.toggled ? styles.bigContainer : styles.smallContainer;

    return (
      <TouchableHighlight onPress={this._onPressButton}>
        <View style={viewStyle}>
          <View style={styles.center}>
            <Text style={styles.whiteText}>
              React Native Button
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  },
});

AppRegistry.registerComponent('SetPropertiesExampleApp', () => SetPropertiesExampleApp);
AppRegistry.registerComponent('RootViewSizeFlexibilityExampleApp', () => RootViewSizeFlexibilityExampleApp);
AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);
UIExplorerList.registerComponents();

module.exports = UIExplorerApp;
