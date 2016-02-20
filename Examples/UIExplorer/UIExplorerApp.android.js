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

const React = require('react-native');
const {
  AppRegistry,
  BackAndroid,
  Dimensions,
  DrawerLayoutAndroid,
  StyleSheet,
  ToolbarAndroid,
  View,
  StatusBar,
} = React;
const UIExplorerList = require('./UIExplorerList.android');

const DRAWER_WIDTH_LEFT = 56;

class UIExplorerApp extends React.Component {
  constructor(props) {
    super(props);
    this.onSelectExample = this.onSelectExample.bind(this);
    this._handleBackButtonPress = this._handleBackButtonPress.bind(this);
    this.state = {
      example: this._getUIExplorerHome(),
    };
  }

  _getUIExplorerHome() {
    return {
      title: 'UIExplorer',
      component: this._renderHome(),
    };
  }

  componentWillMount() {
    BackAndroid.addEventListener('hardwareBackPress', this._handleBackButtonPress);
  }

  render() {
    return (
      <DrawerLayoutAndroid
        drawerPosition={DrawerLayoutAndroid.positions.Left}
        drawerWidth={Dimensions.get('window').width - DRAWER_WIDTH_LEFT}
        keyboardDismissMode="on-drag"
        ref={(drawer) => { this.drawer = drawer; }}
        renderNavigationView={this._renderNavigationView}>
        {this._renderNavigation()}
      </DrawerLayoutAndroid>
    );
  }

  _renderNavigationView() {
    return (
      <UIExplorerList
        onSelectExample={this.onSelectExample}
        isInDrawer={true}
      />
    );
  }

  onSelectExample(example) {
    this.drawer.closeDrawer();
    if (example.title === this._getUIExplorerHome().title) {
      example = this._getUIExplorerHome();
    }
    this.setState({
      example: example,
    });
  }

  _renderHome() {
    const onSelectExample = this.onSelectExample;
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
  }

  _renderNavigation() {
    const Component = this.state.example.component;
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor="#589c90"
        />
        <ToolbarAndroid
          logo={require('image!launcher_icon')}
          navIcon={require('image!ic_menu_black_24dp')}
          onIconClicked={() => this.drawer.openDrawer()}
          style={styles.toolbar}
          title={this.state.example.title}
        />
        <Component
          ref={(example) => { this._exampleRef = example; }}
        />
      </View>
    );
  }

  _handleBackButtonPress() {
    if (
      this._exampleRef &&
      this._exampleRef.handleBackAction &&
      this._exampleRef.handleBackAction()
    ) {
      return true;
    }
    if (this.state.example.title !== this._getUIExplorerHome().title) {
      this.onSelectExample(this._getUIExplorerHome());
      return true;
    }
    return false;
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    backgroundColor: '#E9EAED',
    height: 56,
  },
});

AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);

module.exports = UIExplorerApp;
