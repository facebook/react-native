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
  NavigationExperimental,
  StyleSheet,
  ToolbarAndroid,
  View,
  StatusBar,
} = React;
const {
  RootContainer: NavigationRootContainer,
} = NavigationExperimental;
const UIExplorerActions = require('./UIExplorerActions');
const UIExplorerExampleList = require('./UIExplorerExampleList');
const UIExplorerList = require('./UIExplorerList');
const UIExplorerNavigationReducer = require('./UIExplorerNavigationReducer');
const UIExplorerStateTitleMap = require('./UIExplorerStateTitleMap');

var DRAWER_WIDTH_LEFT = 56;

class UIExplorerApp extends React.Component {
  componentWillMount() {
    BackAndroid.addEventListener('hardwareBackPress', this._handleBackButtonPress.bind(this));
  }

  render() {
    return (
      <NavigationRootContainer
        persistenceKey="UIExplorerStateNavState"
        ref={navRootRef => { this._navigationRootRef = navRootRef; }}
        reducer={UIExplorerNavigationReducer}
        renderNavigation={this._renderApp.bind(this)}
      />
    );
  }

  _renderApp(navigationState, onNavigate) {
    if (!navigationState) {
      return null;
    }
    return (
      <DrawerLayoutAndroid
        drawerPosition={DrawerLayoutAndroid.positions.Left}
        drawerWidth={Dimensions.get('window').width - DRAWER_WIDTH_LEFT}
        keyboardDismissMode="on-drag"
        onDrawerOpen={() => {
          this._overrideBackPressForDrawerLayout = true;
        }}
        onDrawerClose={() => {
          this._overrideBackPressForDrawerLayout = false;
        }}
        ref={(drawer) => { this.drawer = drawer; }}
        renderNavigationView={this._renderDrawerContent.bind(this, onNavigate)}
        statusBarBackgroundColor="#589c90">
        {this._renderNavigation(navigationState, onNavigate)}
      </DrawerLayoutAndroid>
    );
  }

  _renderDrawerContent(onNavigate) {
    return (
      <View style={styles.drawerContentWrapper}>
        <UIExplorerExampleList
          list={UIExplorerList}
          displayTitleRow={true}
          disableSearch={true}
          onNavigate={(action) => {
            this.drawer && this.drawer.closeDrawer();
            onNavigate(action);
          }}
        />
      </View>
    );
  }

  _renderNavigation(navigationState, onNavigate) {
    if (navigationState.externalExample) {
      var Component = UIExplorerList.Modules[navigationState.externalExample];
      return (
        <Component
          onExampleExit={() => {
            onNavigate(NavigationRootContainer.getBackAction());
          }}
          ref={(example) => { this._exampleRef = example; }}
        />
      );
    }
    const {stack} = navigationState;
    const title = UIExplorerStateTitleMap(stack.children[stack.index]);
    const index = stack.children.length <= 1 ?  1 : stack.index;

    if (stack && stack.children[index]) {
      const {key} = stack.children[index];
      const ExampleModule = UIExplorerList.Modules[key];
      const ExampleComponent = UIExplorerExampleList.makeRenderable(ExampleModule);
      return (
        <View style={styles.container}>
          <ToolbarAndroid
            logo={require('image!launcher_icon')}
            navIcon={require('image!ic_menu_black_24dp')}
            onIconClicked={() => this.drawer.openDrawer()}
            style={styles.toolbar}
            title={title}
          />
          <ExampleComponent
            ref={(example) => { this._exampleRef = example; }}
          />
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <ToolbarAndroid
          logo={require('image!launcher_icon')}
          navIcon={require('image!ic_menu_black_24dp')}
          onIconClicked={() => this.drawer.openDrawer()}
          style={styles.toolbar}
          title={title}
        />
        <UIExplorerExampleList
          list={UIExplorerList}
          {...stack.children[0]}
        />
      </View>
    );
  }

  _handleBackButtonPress() {
    if (this._overrideBackPressForDrawerLayout) {
      // This hack is necessary because drawer layout provides an imperative API
      // with open and close methods. This code would be cleaner if the drawer
      // layout provided an `isOpen` prop and allowed us to pass a `onDrawerClose` handler.
      this.drawer && this.drawer.closeDrawer();
      return true;
    }
    if (
      this._exampleRef &&
      this._exampleRef.handleBackAction &&
      this._exampleRef.handleBackAction()
    ) {
      return true;
    }
    if (this._navigationRootRef) {
      return this._navigationRootRef.handleNavigation(
        NavigationRootContainer.getBackAction()
      );
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
  drawerContentWrapper: {
    paddingTop: StatusBar.currentHeight,
    backgroundColor: 'white',
  },
});

AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);

module.exports = UIExplorerApp;
