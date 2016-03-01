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
 * @flow
 */
'use strict';

const React = require('react-native');
const {
  NavigationExperimental,
  ScrollView,
  StyleSheet,
  View,
} = React;
const {
  AnimatedView: NavigationAnimatedView,
  Card: NavigationCard,
  Container: NavigationContainer,
  RootContainer: NavigationRootContainer,
  Header: NavigationHeader,
  Reducer: NavigationReducer,
  View: NavigationView,
} = NavigationExperimental;
const NavigationExampleRow = require('./NavigationExampleRow');
const NavigationExampleTabBar = require('./NavigationExampleTabBar');

import type {NavigationParentState} from 'NavigationStateUtils';

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

function stateTypeTitleMap(pageState) {
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
  render() {
    return (
      <NavigationAnimatedView
        style={styles.tabContent}
        navigationState={this.props.navigationState}
        renderOverlay={this._renderHeader.bind(this)}
        renderScene={this._renderScene.bind(this)}
      />
    );
  }
  _renderHeader(props) {
    return (
      <NavigationHeader
        navigationState={props.navigationParentState}
        position={props.position}
        layout={props.layout}
        getTitle={state => stateTypeTitleMap(state)}
      />
    );
  }
  _renderScene(props) {
    return (
      <NavigationCard
        key={props.navigationState.key}
        index={props.index}
        navigationState={props.navigationParentState}
        position={props.position}
        layout={props.layout}>
        <ScrollView style={styles.scrollView}>
          <NavigationExampleRow
            text="Open page"
            onPress={() => {
              this.props.onNavigate(ExampleInfoAction());
            }}
          />
          <NavigationExampleRow
            text="Open a page in the profile tab"
            onPress={() => {
              this.props.onNavigate(ExampleNotifProfileAction());
            }}
          />
          <NavigationExampleRow
            text="Exit Composition Example"
            onPress={() => {
              this.props.onNavigate(ExampleExitAction());
            }}
          />
        </ScrollView>
      </NavigationCard>
    );
  }
}
ExampleTabScreen = NavigationContainer.create(ExampleTabScreen);

class NavigationCompositionExample extends React.Component {
  navRootContainer: NavigationRootContainer;

  render() {
    return (
      <NavigationRootContainer
        reducer={ExampleAppReducer}
        persistenceKey="NavigationCompositionState"
        ref={navRootContainer => { this.navRootContainer = navRootContainer; }}
        renderNavigation={this.renderApp.bind(this)}
      />
    );
  }
  handleBackAction(): boolean {
    return (
      this.navRootContainer &&
      this.navRootContainer.handleNavigation(NavigationRootContainer.getBackAction())
    );
  }
  renderApp(navigationState: NavigationParentState, onNavigate: Function) {
    if (!navigationState) {
      return null;
    }
    return (
      <View style={styles.topView}>
        <ExampleMainView
          navigationState={navigationState}
          onExampleExit={this.props.onExampleExit}
        />
        <NavigationExampleTabBar
          tabs={navigationState.children}
          index={navigationState.index}
        />
      </View>
    );
  }
}

class ExampleMainView extends React.Component {
  render() {
    return (
      <NavigationView
        navigationState={this.props.navigationState}
        style={styles.tabsContent}
        renderScene={(tabState, index) => (
          <ExampleTabScreen
            key={tabState.key}
            navigationState={tabState}
            onNavigate={this._handleNavigation.bind(this, tabState.key)}
          />
        )}
      />
    );
  }
  _handleNavigation(tabKey, action) {
    if (ExampleExitAction.match(action)) {
      this.props.onExampleExit();
      return;
    }
    this.props.onNavigate(action);
  }
}
ExampleMainView = NavigationContainer.create(ExampleMainView);

const styles = StyleSheet.create({
  topView: {
    flex: 1,
  },
  tabsContent: {
    flex: 1,
  },
  scrollView: {
    marginTop: 64
  },
  tabContent: {
    flex: 1,
  },
});

module.exports = NavigationCompositionExample;
