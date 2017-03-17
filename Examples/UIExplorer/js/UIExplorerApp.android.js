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
const BackHandler = require('BackHandler');
const Dimensions = require('Dimensions');
const DrawerLayoutAndroid = require('DrawerLayoutAndroid');
const Linking = require('Linking');
const React = require('react');
const StatusBar = require('StatusBar');
const StyleSheet = require('StyleSheet');
const ToolbarAndroid = require('ToolbarAndroid');
const UIExplorerActions = require('./UIExplorerActions');
const UIExplorerExampleContainer = require('./UIExplorerExampleContainer');
const UIExplorerExampleList = require('./UIExplorerExampleList');
const UIExplorerList = require('./UIExplorerList');
const UIExplorerNavigationReducer = require('./UIExplorerNavigationReducer');
const UIManager = require('UIManager');
const URIActionMap = require('./URIActionMap');
const View = require('View');

const nativeImageSource = require('nativeImageSource');

import type { UIExplorerNavigationState } from './UIExplorerNavigationReducer';

UIManager.setLayoutAnimationEnabledExperimental(true);

const DRAWER_WIDTH_LEFT = 56;

type Props = {
  exampleFromAppetizeParams: string,
};

const APP_STATE_KEY = 'UIExplorerAppState.v2';

const HEADER_LOGO_ICON = nativeImageSource({
  android: 'launcher_icon',
  width: 132,
  height: 144
});

const HEADER_NAV_ICON = nativeImageSource({
  android: 'ic_menu_black_24dp',
  width: 48,
  height: 48
});

class UIExplorerApp extends React.Component {
  props: Props;
  state: UIExplorerNavigationState;

  componentWillMount() {
    BackHandler.addEventListener('hardwareBackPress', this._handleBackButtonPress);
  }

  componentDidMount() {
    Linking.getInitialURL().then((url) => {
      AsyncStorage.getItem(APP_STATE_KEY, (err, storedString) => {
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

  _renderDrawerContent = () => {
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
  };

  _renderApp() {
    const {
      openExample,
    } = this.state;

    if (openExample) {
      const ExampleModule = UIExplorerList.Modules[openExample];
      if (ExampleModule.external) {
        return (
          <ExampleModule
            onExampleExit={() => {
              this._handleAction(UIExplorerActions.Back());
            }}
            ref={(example) => { this._exampleRef = example; }}
          />
        );
      } else if (ExampleModule) {
        return (
          <View style={styles.container}>
            <ToolbarAndroid
              logo={HEADER_LOGO_ICON}
              navIcon={HEADER_NAV_ICON}
              onIconClicked={() => this.drawer.openDrawer()}
              style={styles.toolbar}
              title={ExampleModule.title}
            />
            <UIExplorerExampleContainer
              module={ExampleModule}
              ref={(example) => { this._exampleRef = example; }}
            />
          </View>
        );
      }
    }

    return (
      <View style={styles.container}>
        <ToolbarAndroid
          logo={HEADER_LOGO_ICON}
          navIcon={HEADER_NAV_ICON}
          onIconClicked={() => this.drawer.openDrawer()}
          style={styles.toolbar}
          title="UIExplorer"
        />
        <UIExplorerExampleList
          onNavigate={this._handleAction}
          list={UIExplorerList}
        />
      </View>
    );
  }

  _handleAction = (action: Object): boolean => {
    this.drawer && this.drawer.closeDrawer();
    const newState = UIExplorerNavigationReducer(this.state, action);
    if (this.state !== newState) {
      this.setState(
        newState,
        () => AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(this.state))
      );
      return true;
    }
    return false;
  };

  _handleBackButtonPress = () => {
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
    return this._handleAction(UIExplorerActions.Back());
  };
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
