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
const NavigationExampleRow = require('./NavigationExampleRow');
const NavigationExampleTabBar = require('./NavigationExampleTabBar');

const {
  NavigationExperimental,
  ScrollView,
  StyleSheet,
  View,
} = React;

const {
  CardStack: NavigationCardStack,
  Container: NavigationContainer,
  Header: NavigationHeader,
  Reducer: NavigationReducer,
  RootContainer: NavigationRootContainer,
  View: NavigationView,
} = NavigationExperimental;


import type {
  NavigationParentState,
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
        renderOverlay={this._renderHeader}
        renderScene={this._renderScene}
      />
    );
  }
  _renderHeader(props: NavigationSceneRendererProps) {
    return (
      <NavigationHeader
        navigationProps={props}
        renderTitleComponent={(navigationProps, scene) => {
          return <NavigationHeader.Title>{stateTypeTitleMap(scene.navigationState)}</NavigationHeader.Title>;
        }}
      />
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
    marginTop: NavigationHeader.HEIGHT
  },
  tabContent: {
    flex: 1,
  },
});

module.exports = NavigationCompositionExample;
