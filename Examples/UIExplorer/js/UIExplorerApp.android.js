/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
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

const AppRegistry = require('AppRegistry');
const AsyncStorage = require('AsyncStorage');
const BackAndroid = require('BackAndroid');
const Dimensions = require('Dimensions');
const DrawerLayoutAndroid = require('DrawerLayoutAndroid');
const Linking = require('Linking');
const React = require('react');
const StatusBar = require('StatusBar');
const StyleSheet = require('StyleSheet');
const ToolbarAndroid = require('ToolbarAndroid');
const UIExplorerExampleContainer = require('./UIExplorerExampleContainer');
const UIExplorerExampleList = require('./UIExplorerExampleList');
const UIExplorerList = require('./UIExplorerList');
const UIExplorerNavigationReducer = require('./UIExplorerNavigationReducer');
const UIExplorerStateTitleMap = require('./UIExplorerStateTitleMap');
const UIManager = require('UIManager');
const URIActionMap = require('./URIActionMap');
const View = require('View');

import type {UIExplorerNavigationState} from './UIExplorerNavigationReducer';

UIManager.setLayoutAnimationEnabledExperimental(true);

const DRAWER_WIDTH_LEFT = 56;

type Props = {
  exampleFromAppetizeParams: string,
};

type State = UIExplorerNavigationState & {
  externalExample: ?string,
};

class UIExplorerApp extends React.Component {
  _handleAction: Function;
  _renderDrawerContent: Function;
  state: State;
  constructor(props: Props) {
    super(props);
    this._handleAction = this._handleAction.bind(this);
    this._renderDrawerContent = this._renderDrawerContent.bind(this);
  }

  componentWillMount() {
    BackAndroid.addEventListener('hardwareBackPress', this._handleBackButtonPress.bind(this));
  }

  componentDidMount() {
    Linking.getInitialURL().then((url) => {
      AsyncStorage.getItem('UIExplorerAppState', (err, storedString) => {
        const exampleAction = URIActionMap(this.props.exampleFromAppetizeParams);
        const urlAction = URIActionMap(url);
        const launchAction = exampleAction || urlAction;
        if (err || !storedString) {
          const initialAction = launchAction || {type: 'InitialAction'};
          this.setState(UIExplorerNavigationReducer(null, initialAction));
          return;
        }
        const storedState = JSON.parse(storedString);
        if (launchAction) {
          this.setState(UIExplorerNavigationReducer(storedState, launchAction));
          return;
        }
        this.setState(storedState);
      });
    });
  }

  render() {
    if (!this.state) {
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
        renderNavigationView={this._renderDrawerContent}
        statusBarBackgroundColor="#589c90">
        {this._renderApp()}
      </DrawerLayoutAndroid>
    );
  }

  _renderDrawerContent() {
    return (
      <View style={styles.drawerContentWrapper}>
        <UIExplorerExampleList
          list={UIExplorerList}
          displayTitleRow={true}
          disableSearch={true}
          onNavigate={this._handleAction}
        />
      </View>
    );
  }

  _renderApp() {
    const {
      externalExample,
      stack,
    } = this.state;
    if (externalExample) {
      const Component = UIExplorerList.Modules[externalExample];
      return (
        <Component
          onExampleExit={() => {
            this._handleAction({ type: 'BackAction' });
          }}
          ref={(example) => { this._exampleRef = example; }}
        />
      );
    }
    const title = UIExplorerStateTitleMap(stack.routes[stack.index]);
    const index = stack.routes.length <= 1 ?  1 : stack.index;

    if (stack && stack.routes[index]) {
      const {key} = stack.routes[index];
      const ExampleModule = UIExplorerList.Modules[key];
      return (
        <View style={styles.container}>
          <ToolbarAndroid
            logo={require('image!launcher_icon')}
            navIcon={require('image!ic_menu_black_24dp')}
            onIconClicked={() => this.drawer.openDrawer()}
            style={styles.toolbar}
            title={title}
          />
          <UIExplorerExampleContainer
            module={ExampleModule}
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
          onNavigate={this._handleAction}
          list={UIExplorerList}
          {...stack.routes[0]}
        />
      </View>
    );
  }

  _handleAction(action: Object): boolean {
    this.drawer && this.drawer.closeDrawer();
    const newState = UIExplorerNavigationReducer(this.state, action);
    if (this.state !== newState) {
      this.setState(
        newState,
        () => AsyncStorage.setItem('UIExplorerAppState', JSON.stringify(this.state))
      );
      return true;
    }
    return false;
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
    return this._handleAction({ type: 'BackAction' });
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
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: 'white',
  },
});

AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);

module.exports = UIExplorerApp;
