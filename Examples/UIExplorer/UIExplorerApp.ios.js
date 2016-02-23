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
const UIExplorerActions = require('./UIExplorerActions');
const UIExplorerList = require('./UIExplorerList.ios');
const UIExplorerExampleList = require('./UIExplorerExampleList');
const UIExplorerNavigationReducer = require('./UIExplorerNavigationReducer');
const UIExplorerStateTitleMap = require('./UIExplorerStateTitleMap');

const {
  AppRegistry,
  NavigationExperimental,
  SnapshotViewIOS,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;
const {
  AnimatedView: NavigationAnimatedView,
  Card: NavigationCard,
  Header: NavigationHeader,
  Reducer: NavigationReducer,
  RootContainer: NavigationRootContainer,
} = NavigationExperimental;
const StackReducer = NavigationReducer.StackReducer;

import type {
  NavigationState,
} from 'NavigationStateUtils'

import type { Value } from 'Animated';
import type { Layout } from 'NavigationAnimatedView';
import type { UIExplorerNavigationState } from './UIExplorerNavigationReducer';

import type {
  UIExplorerExample,
} from './UIExplorerList.ios'

class UIExplorerApp extends React.Component {
  _renderNavigation: Function;
  componentWillMount() {
    this._renderNavigation = this._renderNavigation.bind(this);
  }
  render() {
    return (
      <NavigationRootContainer
        persistenceKey="UIExplorerState"
        reducer={UIExplorerNavigationReducer}
        renderNavigation={this._renderNavigation}
      />
    );
  }
  _renderNavigation(navigationState: UIExplorerNavigationState, onNavigate: Function) {
    if (!navigationState) {
      return null;
    }
    if (navigationState.externalExample) {
      var Component = UIExplorerList.Modules[navigationState.externalExample];
      return (
        <Component
          onExampleExit={() => {
            onNavigate(NavigationRootContainer.getBackAction());
          }}
        />
      );
    }
    const {stack} = navigationState;
    return (
      <NavigationAnimatedView
        navigationState={stack}
        style={styles.container}
        renderOverlay={this._renderOverlay.bind(this, stack)}
        renderScene={this._renderSceneContainer.bind(this, stack)}
      />
    );
  }

  _renderOverlay(
    navigationState: NavigationState,
    position: Value,
    layout: Layout
  ): ReactElement {
    return (
      <NavigationHeader
        navigationState={navigationState}
        position={position}
        getTitle={UIExplorerStateTitleMap}
      />
    );    
  }

  _renderSceneContainer(
    navigationState: NavigationState,
    scene: NavigationState,
    index: number,
    position: Value,
    layout: Layout
  ): ReactElement {
    return (
      <NavigationCard
        key={scene.key}
        index={index}
        navigationState={navigationState}
        position={position}
        layout={layout}>
        {this._renderScene(scene)}
      </NavigationCard>
    );
  }

  _renderScene(state: Object): ?ReactElement {
    if (state.key === 'AppList') {
      return (
        <UIExplorerExampleList
          list={UIExplorerList}
          style={styles.exampleContainer}
          {...state}
        />
      );
    }

    const Example = UIExplorerList.Modules[state.key];
    if (Example) {
      const Component = UIExplorerExampleList.makeRenderable(Example);
      return (
        <View style={styles.exampleContainer}>
          <Component />
        </View>
      );
    }
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exampleContainer: {
    flex: 1,
    paddingTop: 60,
  },
});

AppRegistry.registerComponent('SetPropertiesExampleApp', () => require('./SetPropertiesExampleApp'));
AppRegistry.registerComponent('RootViewSizeFlexibilityExampleApp', () => require('./RootViewSizeFlexibilityExampleApp'));
AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);

// Register suitable examples for snapshot tests
UIExplorerList.ComponentExamples.concat(UIExplorerList.APIExamples).forEach((Example: UIExplorerExample) => {
  const ExampleModule = Example.module;
  if (ExampleModule.displayName) {
    var Snapshotter = React.createClass({
      render: function() {
        var Renderable = UIExplorerExampleList.makeRenderable(ExampleModule);
        return (
          <SnapshotViewIOS>
            <Renderable />
          </SnapshotViewIOS>
        );
      },
    });
    AppRegistry.registerComponent(ExampleModule.displayName, () => Snapshotter);
  }
});

module.exports = UIExplorerApp;
