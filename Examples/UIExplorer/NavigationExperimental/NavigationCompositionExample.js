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

const ExampleExitAction = () => ({
  isExitAction: true,
});
ExampleExitAction.match = (action) => (
  action && action.isExitAction === true
);

const ExamplePageAction = (type) => ({
  type,
  isPageAction: true,
});
ExamplePageAction.match = (action) => (
  action && action.isPageAction === true
);

const ExampleSettingsPageAction = (type) => ({
  ...ExamplePageAction(type),
  isSettingsPageAction: true,
});
ExampleSettingsPageAction.match = (action) => (
  action && action.isSettingsPageAction === true
);

const ExampleInfoAction = () => ExamplePageAction('InfoPage');

const ExampleNotifSettingsAction = () => ExampleSettingsPageAction('NotifSettingsPage');

const _jsInstanceUniqueId = '' + Date.now();
let _uniqueIdCount = 0;
function pageStateActionMap(action) {
  return {
    key: 'page-' + _jsInstanceUniqueId + '-' + (_uniqueIdCount++),
    type: action.type,
  };
}

function getTabActionMatcher(key) {
  return function (action) {
    if (!ExamplePageAction.match(action)) {
      return false;
    }
    if (ExampleSettingsPageAction.match(action)) {
      return key === 'settings';
    }
    return true;
  };
}

var ExampleTabs = [
  {
    label: 'Account',
    reducer: NavigationReducer.StackReducer({
      initialStates: [
        {type: 'AccountPage', key: 'base'}
      ],
      key: 'account',
      matchAction: getTabActionMatcher('account'),
      actionStateMap: pageStateActionMap,
    }),
  },
  {
    label: 'Notifications',
    reducer: NavigationReducer.StackReducer({
      initialStates: [
        {type: 'NotifsPage', key: 'base'}
      ],
      key: 'notifs',
      matchAction: getTabActionMatcher('notifs'),
      actionStateMap: pageStateActionMap,
    }),
  },
  {
    label: 'Settings',
    reducer: NavigationReducer.StackReducer({
      initialStates: [
        {type: 'SettingsPage', key: 'base'}
      ],
      key: 'settings',
      matchAction: getTabActionMatcher('settings'),
      actionStateMap: pageStateActionMap,
    }),
  },
];

const ExampleAppReducer = NavigationReducer.TabsReducer({
  tabReducers: ExampleTabs.map(tab => tab.reducer),
});

function stateTypeTitleMap(pageState) {
  switch (pageState.type) {
    case 'AccountPage':
      return 'Account Page';
    case 'NotifsPage':
      return 'Notifications';
    case 'SettingsPage':
      return 'Settings';
    case 'InfoPage':
      return 'Info Page';
    case 'NotifSettingsPage':
      return 'Notification Settings';
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
  _renderHeader(position, layout) {
    return (
      <NavigationHeader
        navigationState={this.props.navigationState}
        position={position}
        layout={layout}
        getTitle={state => stateTypeTitleMap(state)}
      />
    );
  }
  _renderScene(child, index, position, layout) {
    return (
      <NavigationCard
        key={child.key}
        index={index}
        childState={child}
        navigationState={this.props.navigationState}
        position={position}
        layout={layout}>
        <ScrollView style={styles.scrollView}>
          <NavigationExampleRow
            text="Open page"
            onPress={() => {
              this.props.onNavigate(ExampleInfoAction());
            }}
          />
          <NavigationExampleRow
            text="Open notifs settings in settings tab"
            onPress={() => {
              this.props.onNavigate(ExampleNotifSettingsAction());
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
  render() {
    return (
      <NavigationRootContainer
        reducer={ExampleAppReducer}
        persistenceKey="NavigationCompositionExampleState"
        ref={navRootContainer => { this.navRootContainer = navRootContainer; }}
        renderNavigation={this.renderApp.bind(this)}
      />
    );
  }
  handleBackAction() {
    return (
      this.navRootContainer &&
      this.navRootContainer.handleNavigation(NavigationRootContainer.getBackAction())
    );
  }
  renderApp(navigationState, onNavigate) {
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
