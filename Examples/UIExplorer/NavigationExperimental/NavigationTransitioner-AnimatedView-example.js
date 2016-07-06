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
 * @flow
 */
'use strict';

const NavigationExampleRow = require('./NavigationExampleRow');
const React = require('react');
const ReactNative = require('react-native');

/**
 * Basic example that shows how to use <NavigationTransitioner /> and
 * <Animated.View /> to build a stack of animated scenes that render the
 * navigation state.
 */


import type  {
  NavigationSceneRendererProps,
  NavigationState,
  NavigationTransitionProps,
  NavigationTransitionSpec,
} from 'NavigationTypeDefinition';

const {
  Component,
  PropTypes,
} = React;

const {
  Animated,
  Easing,
  NavigationExperimental,
  ScrollView,
  StyleSheet,
} = ReactNative;

const {
  PropTypes: NavigationPropTypes,
  StateUtils: NavigationStateUtils,
  Transitioner: NavigationTransitioner,
} = NavigationExperimental;

function reducer(state: ?NavigationState, action: any): NavigationState {
  if (!state) {
    return {
      index: 0,
      routes: [{key: 'route-1'}],
    };
  }

  switch (action) {
    case 'push':
      const route = {key: 'route-' + (state.routes.length + 1)};
      return NavigationStateUtils.push(state, route);
    case 'pop':
      return NavigationStateUtils.pop(state);
  }
  return state;
}

class Example extends Component {
  state: NavigationState;
  constructor(props: any, context: any) {
    super(props, context);
    this.state = reducer();
  }

  render(): ReactElement<any> {
    return (
      <ExampleNavigator
        navigationState={this.state}
        navigate={action => this._navigate(action)}
      />
    );
  }

  _navigate(action: any): boolean {
    if (action === 'exit') {
      // Exits the example. `this.props.onExampleExit` is provided
      // by the UI Explorer.
      this.props.onExampleExit && this.props.onExampleExit();
      return false;
    }

    const state = reducer(this.state, action);
    if (state === this.state) {
      return false;
    }

    this.setState(state);
    return true;
  }

  // This public method is optional. If exists, the UI explorer will call it
  // the "back button" is pressed. Normally this is the cases for Android only.
  handleBackAction(): boolean {
    return this._navigate('pop');
  }
}

class ExampleNavigator extends Component {
  props: {
    navigate: Function,
    navigationState: NavigationState,
  };

  static propTypes: {
    navigationState: NavigationPropTypes.navigationState.isRequired,
    navigate: PropTypes.func.isRequired,
  };

  render(): ReactElement<any> {
    return (
      <NavigationTransitioner
        navigationState={this.props.navigationState}
        render={(transitionProps) => this._render(transitionProps)}
        configureTransition={this._configureTransition}
      />
    );
  }

  _render(
    transitionProps: NavigationTransitionProps,
  ): Array<ReactElement<any>> {
    return transitionProps.scenes.map((scene) => {
      const sceneProps = {
        ...transitionProps,
        scene,
      };
      return this._renderScene(sceneProps);
    });
  }

  _renderScene(
    sceneProps: NavigationSceneRendererProps,
  ): ReactElement<any> {
    return (
      <ExampleScene
        {...sceneProps}
        key={sceneProps.scene.key}
        navigate={this.props.navigate}
      />
    );
  }

  _configureTransition(): NavigationTransitionSpec {
    const easing: any = Easing.inOut(Easing.ease);
    return {
      duration: 500,
      easing,
    };
  }
}

class ExampleScene extends Component {
  props: NavigationSceneRendererProps & {
    navigate: Function,
  };

  static propTypes = {
    ...NavigationPropTypes.SceneRendererProps,
    navigate: PropTypes.func.isRequired,
  };

  render(): ReactElement<any> {
    const {scene, navigate} = this.props;
    return (
      <Animated.View
        style={[styles.scene, this._getAnimatedStyle()]}>
        <ScrollView style={styles.scrollView}>
          <NavigationExampleRow
            text={scene.route.key}
          />
          <NavigationExampleRow
            text="Push Route"
            onPress={() => navigate('push')}
          />
          <NavigationExampleRow
            text="Pop Route"
            onPress={() => navigate('pop')}
          />
          <NavigationExampleRow
            text="Exit NavigationTransitioner Example"
            onPress={() => navigate('exit')}
          />
        </ScrollView>
      </Animated.View>
    );
  }

  _getAnimatedStyle(): Object {
    const {
      layout,
      position,
      scene,
    } = this.props;

    const {
      index,
    } = scene;

    const inputRange = [index - 1, index, index + 1];
    const width = layout.initWidth;
    const translateX = position.interpolate({
      inputRange,
      outputRange: [width, 0, -10],
    });

    return {
      transform: [
        { translateX },
      ],
    };
  }
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: '#E9E9EF',
    bottom: 0,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    shadowColor: 'black',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    top: 0,
  },
  scrollView: {
    flex: 1,
  },
});

module.exports = Example;
