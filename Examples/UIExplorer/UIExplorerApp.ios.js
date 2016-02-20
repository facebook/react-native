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
 */
'use strict';

const React = require('react-native');
const UIExplorerList = require('./UIExplorerList.ios');
const SetPropertiesExampleApp = require('./SetPropertiesExampleApp');
const RootViewSizeFlexibilityExampleApp = require('./RootViewSizeFlexibilityExampleApp');
const {
  AppRegistry,
  NavigatorIOS,
  StyleSheet,
  View,
  StatusBar,
} = React;

class UIExplorerApp extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      openExternalExample: (null: ?React.Component),
    };
  }

  render() {
    if (this.state.openExternalExample) {
      const Example = this.state.openExternalExample;
      return (
        <Example
          onExampleExit={() => {
            this.setState({ openExternalExample: null, });
          }}
        />
      );
    }

    return (
      <View style={styles.container}>
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

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemWrapper: {
    backgroundColor: '#eaeaea',
  },
});

AppRegistry.registerComponent('SetPropertiesExampleApp', () => SetPropertiesExampleApp);
AppRegistry.registerComponent('RootViewSizeFlexibilityExampleApp', () => RootViewSizeFlexibilityExampleApp);
AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);
UIExplorerList.registerComponents();

module.exports = UIExplorerApp;
