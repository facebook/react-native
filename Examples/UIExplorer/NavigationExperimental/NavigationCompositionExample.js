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
 * @flow
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const NavigationExampleRow = require('./NavigationExampleRow');
const NavigationExampleTabBar = require('./NavigationExampleTabBar');

const {
  NavigationExperimental,
  ScrollView,
  StyleSheet,
  View,
} = ReactNative;

const {
  CardStack: NavigationCardStack,
  Header: NavigationHeader,
  Reducer: NavigationReducer,
} = NavigationExperimental;


import type {
  NavigationState,
  NavigationSceneRenderer,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

type Action = {
  isExitAction?: boolean,
};

const ExampleExitAction = () => ({
  isExitAction: true,
});

ExampleExitAction.match = (action: Action) => (
  action && action.isExitAction === true
);

const PageAction = (type) => ({
  type,
  isPageAction: true,
});

PageAction.match = (action) => (
  action && action.isPageAction === true
);

const ExampleProfilePageAction = (type) => ({
  ...PageAction(type),
  isProfilePageAction: true,
});

ExampleProfilePageAction.match = (action) => (
  action && action.isProfilePageAction === true
);

const ExampleInfoAction = () => PageAction('InfoPage');

const ExampleNotifProfileAction = () => ExampleProfilePageAction('NotifProfilePage');

const _jsInstanceUniqueId = '' + Date.now();

let _uniqueIdCount = 0;

function pageStateActionMap(action) {
  return {
    key: 'page-' + _jsInstanceUniqueId + '-' + (_uniqueIdCount++),
    type: action.type,
  };
}

const ExampleAppReducer = NavigationReducer.TabsReducer({
  key: 'AppNavigationState',
  initialIndex: 0,
  tabReducers: [
    NavigationReducer.StackReducer({
      getPushedReducerForAction: (action) => {
        if (PageAction.match(action) && !ExampleProfilePageAction.match(action)) {
          return (state) => (state || pageStateActionMap(action));
        }
        return null;
      },
      initialState: {
        key: 'notifs',
        index: 0,
        children: [
          {key: 'base', type: 'NotifsPage'},
        ],
      },
    }),
    NavigationReducer.StackReducer({
      getPushedReducerForAction: (action) => {
        if (PageAction.match(action) && !ExampleProfilePageAction.match(action)) {
          return (state) => (state || pageStateActionMap(action));
        }
        return null;
      },
      initialState: {
        key: 'settings',
        index: 0,
        children: [
          {key: 'base', type: 'SettingsPage'},
        ],
      },
    }),
    NavigationReducer.StackReducer({
      getPushedReducerForAction: (action) => {
        if (PageAction.match(action) || ExampleProfilePageAction.match(action)) {
          return (state) => (state || pageStateActionMap(action));
        }
        return null;
      },
      initialState: {
        key: 'profile',
        index: 0,
        children: [
          {key: 'base', type: 'ProfilePage'},
        ],
      },
    }),
  ],
});

function stateTypeTitleMap(pageState: any) {
  switch (pageState.type) {
    case 'ProfilePage':
      return 'Profile Page';
    case 'NotifsPage':
      return 'Notifications';
    case 'SettingsPage':
      return 'Settings';
    case 'InfoPage':
      return 'Info Page';
    case 'NotifProfilePage':
      return 'Page in Profile';
  }
}

class ExampleTabScreen extends React.Component {
  _renderCard: NavigationSceneRenderer;
  _renderHeader: NavigationSceneRenderer;
  _renderScene: NavigationSceneRenderer;

  componentWillMount() {
    this._renderHeader = this._renderHeader.bind(this);
    this._renderScene = this._renderScene.bind(this);
  }

  render() {
    return (
      <NavigationCardStack
        style={styles.tabContent}
        navigationState={this.props.navigationState}
        onNavigate={this.props.onNavigate}
        renderOverlay={this._renderHeader}
        renderScene={this._renderScene}
      />
    );
  }
  _renderHeader(props: NavigationSceneRendererProps) {
    return (
      <NavigationHeader
        {...props}
        renderTitleComponent={this._renderTitleComponent}
      />
    );
  }

  _renderTitleComponent(props: NavigationSceneRendererProps) {
    return (
      <NavigationHeader.Title>
        {stateTypeTitleMap(props.scene.route)}
      </NavigationHeader.Title>
    );
  }

  _renderScene(props: NavigationSceneRendererProps) {
    const {onNavigate} = props;
    return (
      <ScrollView style={styles.scrollView}>
        <NavigationExampleRow
          text="Open page"
          onPress={() => {
            onNavigate(ExampleInfoAction());
          }}
        />
        <NavigationExampleRow
          text="Open a page in the profile tab"
          onPress={() => {
            onNavigate(ExampleNotifProfileAction());
          }}
        />
        <NavigationExampleRow
          text="Exit Composition Example"
          onPress={() => {
            onNavigate(ExampleExitAction());
          }}
        />
      </ScrollView>
    );
  }
}

class NavigationCompositionExample extends React.Component {
  state: NavigationState;
  constructor() {
    super();
    this.state = ExampleAppReducer(undefined, {});
  }
  handleAction(action: Object): boolean {
    if (!action) {
      return false;
    }
    const newState = ExampleAppReducer(this.state, action);
    if (newState === this.state) {
      return false;
    }
    this.setState(newState);
    return true;
  }
  handleBackAction(): boolean {
    return this.handleAction({ type: 'BackAction' });
  }
  render() {
    if (!this.state) {
      return null;
    }
    return (
      <View style={styles.topView}>
        <ExampleMainView
          navigationState={this.state}
          onExampleExit={this.props.onExampleExit}
          onNavigate={this.handleAction.bind(this)}
        />
        <NavigationExampleTabBar
          tabs={this.state.children}
          index={this.state.index}
          onNavigate={this.handleAction.bind(this)}
        />
      </View>
    );
  }
}

class ExampleMainView extends React.Component {
  _renderScene: Function;
  _handleNavigation: Function;

  componentWillMount() {
    this._renderScene = this._renderScene.bind(this);
    this._handleNavigation = this._handleNavigation.bind(this);
  }

  render() {
    return (
      <View style={styles.tabsContent}>
        {this._renderScene()}
      </View>
    );
  }

  _renderScene(): ReactElement {
    const {navigationState} = this.props;
    const childState = navigationState.children[navigationState.index];
    return (
      <ExampleTabScreen
        key={'tab_screen' + childState.key}
        navigationState={childState}
        onNavigate={this._handleNavigation}
      />
    );
  }

  _handleNavigation(action: Object) {
    if (ExampleExitAction.match(action)) {
      this.props.onExampleExit();
      return;
    }
    this.props.onNavigate(action);
  }
}

const styles = StyleSheet.create({
  topView: {
    flex: 1,
  },
  tabsContent: {
    flex: 1,
  },
  scrollView: {
    marginTop: NavigationHeader.HEIGHT
  },
  tabContent: {
    flex: 1,
  },
});

module.exports = NavigationCompositionExample;
