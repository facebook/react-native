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

const React = require('react-native');
const UIExplorerList = require('./UIExplorerList.ios');
const UIExplorerExampleList = require('./UIExplorerExampleList');
const UIExplorerNavigationReducer = require('./UIExplorerNavigationReducer');
const UIExplorerStateTitleMap = require('./UIExplorerStateTitleMap');
const URIActionMap = require('./URIActionMap');

const {
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

type Props = {
  exampleFromAppetizeParams: string,
};

type State = {
  initialExampleUri: ?string,
};

class UIExplorerApp extends React.Component {
  _navigationRootRef: ?NavigationRootContainer;
  _renderNavigation: Function;
  _renderOverlay: Function;
  _renderScene: Function;
  _renderCard: Function;
  _renderTitleComponent: Function;
  _handleOpenInitialExample: Function;
  state: State;
  constructor(props: Props) {
    super(props);
    this._handleOpenInitialExample = this._handleOpenInitialExample.bind(this);
    this.state = {
      initialExampleUri: props.exampleFromAppetizeParams,
    };
  }
  componentWillMount() {
    this._renderNavigation = this._renderNavigation.bind(this);
    this._renderOverlay = this._renderOverlay.bind(this);
    this._renderScene = this._renderScene.bind(this);
    this._renderTitleComponent = this._renderTitleComponent.bind(this);
  }
  componentDidMount() {
    // There's a race condition if we try to navigate to the specified example
    // from the initial props at the same time the navigation logic is setting
    // up the initial navigation state. This hack adds a delay to avoid this
    // scenario. So after the initial example list is shown, we then transition
    // to the initial example.
    setTimeout(this._handleOpenInitialExample, 500);
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
  _handleOpenInitialExample() {
    if (this.state.initialExampleUri) {
      const exampleAction = URIActionMap(this.state.initialExampleUri);
      if (exampleAction && this._navigationRootRef) {
        this._navigationRootRef.handleNavigation(exampleAction);
      }
    }
    this.setState({initialExampleUri: null});
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
        {...props}
        renderTitleComponent={this._renderTitleComponent}
      />
    );
  }

  _renderTitleComponent(props: NavigationSceneRendererProps): ReactElement {
    return (
      <NavigationHeader.Title>
        {UIExplorerStateTitleMap(props.scene.navigationState)}
      </NavigationHeader.Title>
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
