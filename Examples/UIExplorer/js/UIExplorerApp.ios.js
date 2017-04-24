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
const BackHandler = require('BackHandler');
const Linking = require('Linking');
const React = require('react');
const ReactNative = require('react-native');
const UIExplorerActions = require('./UIExplorerActions');
const UIExplorerExampleContainer = require('./UIExplorerExampleContainer');
const UIExplorerExampleList = require('./UIExplorerExampleList');
const UIExplorerList = require('./UIExplorerList.ios');
const UIExplorerNavigationReducer = require('./UIExplorerNavigationReducer');
const URIActionMap = require('./URIActionMap');

const {
  Button,
  AppRegistry,
  SnapshotViewIOS,
  StyleSheet,
  Text,
  View,
} = ReactNative;

import type { UIExplorerExample } from './UIExplorerList.ios';
import type { UIExplorerAction } from './UIExplorerActions';
import type { UIExplorerNavigationState } from './UIExplorerNavigationReducer';

type Props = {
  exampleFromAppetizeParams: string,
};

const APP_STATE_KEY = 'UIExplorerAppState.v2';

const Header = ({ onBack, title}) => (
  <View style={styles.header}>
    <View style={styles.headerCenter}>
      <Text style={styles.title}>{title}</Text>
    </View>
    {onBack && <View style={styles.headerLeft}>
      <Button title="Back" onPress={onBack} />
    </View>}
  </View>
);

class UIExplorerApp extends React.Component {
  props: Props;
  state: UIExplorerNavigationState;

  componentWillMount() {
    BackHandler.addEventListener('hardwareBackPress', this._handleBack);
  }

  componentDidMount() {
    Linking.getInitialURL().then((url) => {
      AsyncStorage.getItem(APP_STATE_KEY, (err, storedString) => {
        const exampleAction = URIActionMap(this.props.exampleFromAppetizeParams);
        const urlAction = URIActionMap(url);
        const launchAction = exampleAction || urlAction;
        if (err || !storedString) {
          const initialAction = launchAction || {type: 'InitialAction'};
          this.setState(UIExplorerNavigationReducer(undefined, initialAction));
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

  _handleBack = () => {
    this._handleAction(UIExplorerActions.Back());
  }

  _handleAction = (action: ?UIExplorerAction) => {
    if (!action) {
      return;
    }
    const newState = UIExplorerNavigationReducer(this.state, action);
    if (this.state !== newState) {
      this.setState(
        newState,
        () => AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(this.state))
      );
    }
  }

  render() {
    if (!this.state) {
      return null;
    }
    if (this.state.openExample) {
      const Component = UIExplorerList.Modules[this.state.openExample];
      if (Component.external) {
        return (
          <Component
            onExampleExit={this._handleBack}
          />
        );
      } else {
        return (
          <View style={styles.exampleContainer}>
            <Header onBack={this._handleBack} title={Component.title} />
            <UIExplorerExampleContainer module={Component} />
          </View>
        );
      }

    }
    return (
      <View style={styles.exampleContainer}>
        <Header title="UIExplorer" />
        <UIExplorerExampleList
          onNavigate={this._handleAction}
          list={UIExplorerList}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#96969A',
    backgroundColor: '#F5F5F6',
    flexDirection: 'row',
    paddingTop: 20,
  },
  headerLeft: {
  },
  headerCenter: {
    flex: 1,
    position: 'absolute',
    top: 27,
    left: 0,
    right: 0,
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  exampleContainer: {
    flex: 1,
  },
});

AppRegistry.registerComponent('SetPropertiesExampleApp', () => require('./SetPropertiesExampleApp'));
AppRegistry.registerComponent('RootViewSizeFlexibilityExampleApp', () => require('./RootViewSizeFlexibilityExampleApp'));
AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);

// Register suitable examples for snapshot tests
UIExplorerList.ComponentExamples.concat(UIExplorerList.APIExamples).forEach((Example: UIExplorerExample) => {
  const ExampleModule = Example.module;
  if (ExampleModule.displayName) {
    class Snapshotter extends React.Component {
      render() {
        return (
          <SnapshotViewIOS>
            <UIExplorerExampleContainer module={ExampleModule} />
          </SnapshotViewIOS>
        );
      }
    }

    AppRegistry.registerComponent(ExampleModule.displayName, () => Snapshotter);
  }
});

module.exports = UIExplorerApp;
