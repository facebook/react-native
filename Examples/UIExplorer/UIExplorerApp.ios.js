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
  Alert,
  AppRegistry,
  NavigationExperimental,
  SnapshotViewIOS,
  StyleSheet,
  View,
} = React;

const {
  CardStack: NavigationCardStack,
  Header: NavigationHeader,
  RootContainer: NavigationRootContainer,
} = NavigationExperimental;

import type { NavigationSceneRendererProps } from 'NavigationTypeDefinition';

import type { UIExplorerNavigationState } from './UIExplorerNavigationReducer';

import type { UIExplorerExample } from './UIExplorerList.ios';

function PathActionMap(path: string): ?Object {
  // Warning! Hacky parsing for example code. Use a library for this!
  const exampleParts = path.split('/example/');
  const exampleKey = exampleParts[1];
  if (exampleKey) {
    if (!UIExplorerList.Modules[exampleKey]) {
      Alert.alert(`${exampleKey} example could not be found!`);
      return null;
    }
    return UIExplorerActions.ExampleAction(exampleKey);
  }
  return null;
}

function URIActionMap(uri: ?string): ?Object {
  // Warning! Hacky parsing for example code. Use a library for this!
  if (!uri) {
    return null;
  }
  const parts = uri.split('rnuiexplorer:/');
  if (!parts[1]) {
    return null;
  }
  const path = parts[1];
  return PathActionMap(path);
}

class UIExplorerApp extends React.Component {
  _navigationRootRef: ?NavigationRootContainer;
  _renderNavigation: Function;
  _renderOverlay: Function;
  _renderScene: Function;
  _renderCard: Function;
  componentWillMount() {
    this._renderNavigation = this._renderNavigation.bind(this);
    this._renderOverlay = this._renderOverlay.bind(this);
    this._renderScene = this._renderScene.bind(this);
  }
  render() {
    return (
      <NavigationRootContainer
        persistenceKey="UIExplorerState"
        reducer={UIExplorerNavigationReducer}
        ref={navRootRef => { this._navigationRootRef = navRootRef; }}
        renderNavigation={this._renderNavigation}
        linkingActionMap={URIActionMap}
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
      <NavigationCardStack
        navigationState={stack}
        style={styles.container}
        renderOverlay={this._renderOverlay}
        renderScene={this._renderScene}
      />
    );
  }

  _renderOverlay(props: NavigationSceneRendererProps): ReactElement {
    return (
      <NavigationHeader
        key={'header_' + props.scene.navigationState.key}
        navigationProps={props}
        renderTitleComponent={(navigationProps, scene) => {
          return <NavigationHeader.Title>{UIExplorerStateTitleMap(scene.navigationState)}</NavigationHeader.Title>;
        }}
      />
    );
  }

  _renderScene(props: NavigationSceneRendererProps): ?ReactElement {
    const state = props.scene.navigationState;
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
    paddingTop: NavigationHeader.HEIGHT,
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
