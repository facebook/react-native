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
 * an app with controlled navigation system.
 */
const {
  NavigationExperimental,
  ScrollView,
  StyleSheet,
} = ReactNative;

const {
  CardStack: NavigationCardStack,
  StateUtils: NavigationStateUtils,
} = NavigationExperimental;

// Step 1:
// Define a component for your application.
class YourApplication extends React.Component {

  // This sets up the initial navigation state.
  constructor(props, context) {
    super(props, context);

    this.state = {
      // This defines the initial navigation state.
      navigationState: {
        index: 0, // starts with first route focused.
        routes: [{key: 'Welcome'}], // starts with only one route.
      },
    };

    this._exit = this._exit.bind(this);
    this._onNavigationChange = this._onNavigationChange.bind(this);
  }

  // User your own navigator (see Step 2).
  render(): ReactElement {
    return (
      <YourNavigator
        navigationState={this.state.navigationState}
        onNavigationChange={this._onNavigationChange}
        onExit={this._exit}
      />
    );
  }

  // This handles the navigation state changes. You're free and responsible
  // to define the API that changes that navigation state. In this exmaple,
  // we'd simply use a `function(type: string)` to update the navigation state.
  _onNavigationChange(type: string): void {
    let {navigationState} = this.state;
    switch (type) {
      case 'push':
        // push a new route.
        const route = {key: 'route-' + Date.now()};
        navigationState = NavigationStateUtils.push(navigationState, route);
        break;

      case 'pop':
        navigationState = NavigationStateUtils.pop(navigationState);
        break;
    }

    // NavigationStateUtils gives you back the same `navigationState` if nothing
    // has changed. You could use that to avoid redundant re-rendering.
    if (this.state.navigationState !== navigationState) {
      this.setState({navigationState});
    }
  }

  // Exits the example. `this.props.onExampleExit` is provided
  // by the UI Explorer.
  _exit(): void {
    this.props.onExampleExit && this.props.onExampleExit();
  }

  // This public method is optional. If exists, the UI explorer will call it
  // the "back button" is pressed. Normally this is the cases for Android only.
  handleBackAction(): boolean {
    return this._onNavigationChange('pop');
  }
}

// Step 2:
// Define your own controlled navigator.
//
//      +------------+
//    +-+            |
//  +-+ |            |
//  | | |            |
//  | | |   Active   |
//  | | |   Scene    |
//  | | |            |
//  +-+ |            |
//    +-+            |
//      +------------+
//
class YourNavigator extends React.Component {

  // This sets up the methods (e.g. Pop, Push) for navigation.
  constructor(props: any, context: any) {
    super(props, context);

    this._onPushRoute = this.props.onNavigationChange.bind(null, 'push');
    this._onPopRoute = this.props.onNavigationChange.bind(null, 'pop');

    this._renderScene = this._renderScene.bind(this);
  }

  // Now use the `NavigationCardStack` to render the scenes.
  render(): ReactElement {
    return (
      <NavigationCardStack
        onNavigateBack={this._onPopRoute}
        navigationState={this.props.navigationState}
        renderScene={this._renderScene}
        style={styles.navigator}
      />
    );
  }

  // Render a scene for route.
  // The detailed spec of `sceneProps` is defined at `NavigationTypeDefinition`
  // as type `NavigationSceneRendererProps`.
  _renderScene(sceneProps: Object): ReactElement {
    return (
      <YourScene
        route={sceneProps.scene.route}
        onPushRoute={this._onPushRoute}
        onPopRoute={this._onPopRoute}
        onExit={this.props.onExit}
      />
    );
  }
}

// Step 3:
// Define your own scene.
class YourScene extends React.Component {
  render() {
    return (
      <ScrollView style={styles.scrollView}>
        <NavigationExampleRow
          text={'route = ' + this.props.route.key}
        />
        <NavigationExampleRow
          text="Push Route"
          onPress={this.props.onPushRoute}
        />
        <NavigationExampleRow
          text="Pop Route"
          onPress={this.props.onPopRoute}
        />
        <NavigationExampleRow
          text="Exit Card Stack Example"
          onPress={this.props.onExit}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  navigator: {
    flex: 1,
  },
  scrollView: {
    marginTop: 64
  },
});

module.exports = YourApplication;
