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
var UIExplorerList = require('./UIExplorerList');
var {
  AppRegistry,
  NavigatorIOS,
  StyleSheet,
} = React;

var UIExplorerApp = React.createClass({

  getInitialState: function() {
    return {
      openExternalExample: (null: ?React.Component),
      tintColor: '#008888',
      barTintColor: (null: ?string),
      titleTextColor: (null: ?string),
    };
  },

  _customNavColors: function() {
    this.setState({
      tintColor: '#FFFFFF',
      barTintColor: '#05A5D1',
      titleTextColor: '#FFFFFF',
    });
  },

  _resetNavColors: function() {
    this.setState({
      tintColor: "#008888",
      barTintColor: "#F7F7F7",
      titleTextColor: '#000000',
    });
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
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          title: 'UIExplorer',
          component: UIExplorerList,
          passProps: {
            onExternalExampleRequested: (example) => {
              this.setState({ openExternalExample: example, });
            },
            customNavBarColors: () => this._customNavColors(),
            resetNavBarColors: () => this._resetNavColors(),
          }
        }}
        itemWrapperStyle={styles.itemWrapper}
        tintColor={this.state.tintColor}
        barTintColor={this.state.barTintColor}
        titleTextColor={this.state.titleTextColor}
      />
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
});

AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);

module.exports = UIExplorerApp;
