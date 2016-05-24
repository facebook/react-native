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

const AsyncStorage = require('AsyncStorage');
const Linking = require('Linking');
const React = require('react');
const ReactNative = require('react-native');
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
} = ReactNative;

const {
  CardStack: NavigationCardStack,
  Header: NavigationHeader,
} = NavigationExperimental;

import type { NavigationSceneRendererProps } from 'NavigationTypeDefinition';

import type { UIExplorerNavigationState } from './UIExplorerNavigationReducer';

import type { UIExplorerExample } from './UIExplorerList.ios';

type Props = {
  exampleFromAppetizeParams: string,
};

type State = UIExplorerNavigationState & {
  externalExample?: string,
};

class UIExplorerApp extends React.Component {
  _renderOverlay: Function;
  _renderScene: Function;
  _renderCard: Function;
  _renderTitleComponent: Function;
  _handleAction: Function;
  state: State;

  constructor(props: Props) {
    super(props);
  }

  componentWillMount() {
    this._handleAction = this._handleAction.bind(this);
    this._renderOverlay = this._renderOverlay.bind(this);
    this._renderScene = this._renderScene.bind(this);
    this._renderTitleComponent = this._renderTitleComponent.bind(this);
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

    Linking.addEventListener('url', (url) => {
      this._handleAction(URIActionMap(url));
    });
  }

  _handleAction(action: Object) {
    if (!action) {
      return;
    }
    const newState = UIExplorerNavigationReducer(this.state, action);
    if (this.state !== newState) {
      this.setState(newState);
      AsyncStorage.setItem('UIExplorerAppState', JSON.stringify(this.state));
    }
  }

  render() {
    if (!this.state) {
      return null;
    }
    if (this.state.externalExample) {
      const Component = UIExplorerList.Modules[this.state.externalExample];
      return (
        <Component
          onExampleExit={() => {
            this._handleAction({ type: 'BackAction' });
          }}
        />
      );
    }
    return (
      <NavigationCardStack
        navigationState={this.state.stack}
        style={styles.container}
        renderOverlay={this._renderOverlay}
        renderScene={this._renderScene}
        onNavigate={this._handleAction}
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
        {UIExplorerStateTitleMap(props.scene.route)}
      </NavigationHeader.Title>
    );
  }

  _renderScene(props: NavigationSceneRendererProps): ?ReactElement {
    const state = props.scene.route;
    if (state.key === 'AppList') {
      return (
        <UIExplorerExampleList
          onNavigate={this._handleAction}
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
    const Snapshotter = React.createClass({
      render: function() {
        const Renderable = UIExplorerExampleList.makeRenderable(ExampleModule);
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
