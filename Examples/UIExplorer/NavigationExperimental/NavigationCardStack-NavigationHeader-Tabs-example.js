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
*/
'use strict';

const NavigationExampleRow = require('./NavigationExampleRow');
const React = require('react');
const ReactNative = require('react-native');

/**
 * Basic example that shows how to use <NavigationCardStack /> to build
 * an app with composite navigation system.
 */

const {
  Component,
  PropTypes,
} = React;

const {
  NavigationExperimental,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = ReactNative;

const {
  CardStack: NavigationCardStack,
  Header: NavigationHeader,
  PropTypes: NavigationPropTypes,
  StateUtils: NavigationStateUtils,
} = NavigationExperimental;

// First Step.
// Define what app navigation state will look like.
function createAppNavigationState(): Object {
  return  {
    // Three tabs.
    tabs: {
      index: 0,
      routes: [
        {key: 'apple'},
        {key: 'banana'},
        {key: 'orange'},
      ],
    },
    // Scenes for the `apple` tab.
    apple: {
      index: 0,
      routes: [{key: 'Apple Home'}],
    },
    // Scenes for the `banana` tab.
    banana: {
      index: 0,
      routes: [{key: 'Banana Home'}],
    },
    // Scenes for the `orange` tab.
    orange: {
      index: 0,
      routes: [{key: 'Orange Home'}],
    },
  };
}

// Next step.
// Define what app navigation state shall be updated.
function updateAppNavigationState(
  state: Object,
  action: Object,
): Object {
  let {type} = action;
  if (type === 'BackAction') {
    type = 'pop';
  }

  switch (type) {
    case 'push': {
      // Push a route into the scenes stack.
      const route: Object = action.route;
      const {tabs} = state;
      const tabKey = tabs.routes[tabs.index].key;
      const scenes = state[tabKey];
      const nextScenes = NavigationStateUtils.push(scenes, route);
      if (scenes !== nextScenes) {
        return {
          ...state,
          [tabKey]: nextScenes,
        };
      }
      break;
    }

    case 'pop': {
      // Pops a route from the scenes stack.
      const {tabs} = state;
      const tabKey = tabs.routes[tabs.index].key;
      const scenes = state[tabKey];
      const nextScenes = NavigationStateUtils.pop(scenes);
      if (scenes !== nextScenes) {
        return {
          ...state,
          [tabKey]: nextScenes,
        };
      }
      break;
    }

    case 'selectTab': {
      // Switches the tab.
      const tabKey: string = action.tabKey;
      const tabs = NavigationStateUtils.jumpTo(state.tabs, tabKey);
      if (tabs !== state.tabs) {
        return {
          ...state,
          tabs,
        };
      }
    }
  }
  return state;
}

// Next step.
// Defines a helper function that creates a HOC (higher-order-component)
// which provides a function `navigate` through component props. The
// `navigate` function will be used to invoke navigation changes.
// This serves a convenient way for a component to navigate.
function createAppNavigationContainer(ComponentClass) {
  const key = '_yourAppNavigationContainerNavigateCall';

  class Container extends Component {
    static contextTypes = {
      [key]: PropTypes.func,
    };

    static childContextTypes = {
      [key]: PropTypes.func.isRequired,
    };

    static propTypes = {
      navigate: PropTypes.func,
    };

    getChildContext(): Object {
      return {
        [key]: this.context[key] || this.props.navigate,
      };
    }

    render(): ReactElement {
      const navigate = this.context[key] || this.props.navigate;
      return <ComponentClass {...this.props} navigate={navigate} />;
    }
  }

  return Container;
}

// Next step.
// Define a component for your application that owns the navigation state.
class YourApplication extends Component {

  static propTypes = {
    onExampleExit: PropTypes.func,
  };

  // This sets up the initial navigation state.
  constructor(props, context) {
    super(props, context);
    // This sets up the initial navigation state.
    this.state = createAppNavigationState();
    this._navigate = this._navigate.bind(this);
  }

  render(): ReactElement {
    // User your own navigator (see next step).
    return (
      <YourNavigator
        appNavigationState={this.state}
        navigate={this._navigate}
      />
    );
  }

  // This public method is optional. If exists, the UI explorer will call it
  // the "back button" is pressed. Normally this is the cases for Android only.
  handleBackAction(): boolean {
    return this._navigate({type: 'pop'});
  }

  // This handles the navigation state changes. You're free and responsible
  // to define the API that changes that navigation state. In this exmaple,
  // we'd simply use a `updateAppNavigationState` to update the navigation
  // state.
  _navigate(action: Object): void {
    if (action.type === 'exit') {
      // Exits the example. `this.props.onExampleExit` is provided
      // by the UI Explorer.
      this.props.onExampleExit && this.props.onExampleExit();
      return;
    }

    const state = updateAppNavigationState(
      this.state,
      action,
    );

    // `updateAppNavigationState` (which uses NavigationStateUtils) gives you
    // back the same `state` if nothing has changed. You could use
    // that to avoid redundant re-rendering.
    if (this.state !== state) {
      this.setState(state);
    }
  }
}

// Next step.
// Define your own controlled navigator.
const YourNavigator = createAppNavigationContainer(class extends Component {
  static propTypes = {
    appNavigationState: PropTypes.shape({
      apple: NavigationPropTypes.navigationState.isRequired,
      banana: NavigationPropTypes.navigationState.isRequired,
      orange: NavigationPropTypes.navigationState.isRequired,
      tabs: NavigationPropTypes.navigationState.isRequired,
    }),
    navigate: PropTypes.func.isRequired,
  };

  // This sets up the methods (e.g. Pop, Push) for navigation.
  constructor(props: any, context: any) {
    super(props, context);
    this._back = this._back.bind(this);
    this._renderHeader = this._renderHeader.bind(this);
    this._renderScene = this._renderScene.bind(this);
  }

  // Now use the `NavigationCardStack` to render the scenes.
  render(): ReactElement {
    const {appNavigationState} = this.props;
    const {tabs} = appNavigationState;
    const tabKey = tabs.routes[tabs.index].key;
    const scenes = appNavigationState[tabKey];

    return (
      <View style={styles.navigator}>
        <NavigationCardStack
          key={'stack_' + tabKey}
          onNavigateBack={this._back}
          navigationState={scenes}
          renderOverlay={this._renderHeader}
          renderScene={this._renderScene}
          style={styles.navigatorCardStack}
        />
        <YourTabs
          navigationState={tabs}
        />
      </View>
    );
  }

  // Render the header.
  // The detailed spec of `sceneProps` is defined at `NavigationTypeDefinition`
  // as type `NavigationSceneRendererProps`.
  _renderHeader(sceneProps: Object): ReactElement {
    return (
      <YourHeader
        {...sceneProps}
      />
    );
  }

  // Render a scene for route.
  // The detailed spec of `sceneProps` is defined at `NavigationTypeDefinition`
  // as type `NavigationSceneRendererProps`.
  _renderScene(sceneProps: Object): ReactElement {
    return (
      <YourScene
        {...sceneProps}
      />
    );
  }

  _back() {
    this.props.navigate({type: 'pop'});
  }
});

// Next step.
// Define your own header.
const YourHeader = createAppNavigationContainer(class extends Component {
  static propTypes = {
    ...NavigationPropTypes.SceneRendererProps,
    navigate: PropTypes.func.isRequired,
  };

  constructor(props: Object, context: any) {
    super(props, context);
    this._back = this._back.bind(this);
    this._renderTitleComponent = this._renderTitleComponent.bind(this);
  }

  render(): ReactElement {
    return (
      <NavigationHeader
        {...this.props}
        renderTitleComponent={this._renderTitleComponent}
        onNavigateBack={this._back}
      />
    );
  }

  _back(): void {
    this.props.navigate({type: 'pop'});
  }

  _renderTitleComponent(): ReactElement {
    return (
      <NavigationHeader.Title>
        {this.props.scene.route.key}
      </NavigationHeader.Title>
    );
  }
});

// Next step.
// Define your own scene.
const YourScene = createAppNavigationContainer(class extends Component {
  static propTypes = {
    ...NavigationPropTypes.SceneRendererProps,
    navigate: PropTypes.func.isRequired,
  };

  constructor(props: Object, context: any) {
    super(props, context);
    this._exit = this._exit.bind(this);
    this._popRoute = this._popRoute.bind(this);
    this._pushRoute = this._pushRoute.bind(this);
  }

  render(): ReactElement {
    return (
      <ScrollView style={styles.scrollView}>
        <NavigationExampleRow
          text="Push Route"
          onPress={this._pushRoute}
        />
        <NavigationExampleRow
          text="Pop Route"
          onPress={this._popRoute}
        />
        <NavigationExampleRow
          text="Exit Header + Scenes + Tabs Example"
          onPress={this._exit}
        />
      </ScrollView>
    );
  }

  _pushRoute(): void {
    // Just push a route with a new unique key.
    const route = {key: '[' + this.props.scenes.length + ']-' + Date.now()};
    this.props.navigate({type: 'push', route});
  }

  _popRoute(): void {
    this.props.navigate({type: 'pop'});
  }

  _exit(): void {
    this.props.navigate({type: 'exit'});
  }
});

// Next step.
// Define your own tabs.
const YourTabs = createAppNavigationContainer(class extends Component {
  static propTypes = {
    navigationState: NavigationPropTypes.navigationState.isRequired,
    navigate: PropTypes.func.isRequired,
  };

  constructor(props: Object, context: any) {
    super(props, context);
  }

  render(): ReactElement {
    return (
      <View style={styles.tabs}>
        {this.props.navigationState.routes.map(this._renderTab, this)}
      </View>
    );
  }

  _renderTab(route: Object, index: number): ReactElement {
    return (
      <YourTab
        key={route.key}
        route={route}
        selected={this.props.navigationState.index === index}
      />
    );
  }
});

// Next step.
// Define your own Tab
const YourTab = createAppNavigationContainer(class extends Component {

  static propTypes = {
    navigate: PropTypes.func.isRequired,
    route: NavigationPropTypes.navigationRoute.isRequired,
    selected: PropTypes.bool.isRequired,
  };

  constructor(props: Object, context: any) {
    super(props, context);
    this._onPress = this._onPress.bind(this);
  }

  render(): ReactElement {
    const style = [styles.tabText];
    if (this.props.selected) {
      style.push(styles.tabSelected);
    }
    return (
      <TouchableOpacity style={styles.tab} onPress={this._onPress}>
        <Text style={style}>
          {this.props.route.key}
        </Text>
      </TouchableOpacity>
    );
  }

  _onPress() {
    this.props.navigate({type: 'selectTab', tabKey: this.props.route.key});
  }
});

const styles = StyleSheet.create({
  navigator: {
    flex: 1,
  },
  navigatorCardStack: {
    flex: 20,
  },
  scrollView: {
    marginTop: 64
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  tabText: {
    color: '#222',
    fontWeight: '500',
  },
  tabSelected: {
    color: 'blue',
  },
});

module.exports = YourApplication;
