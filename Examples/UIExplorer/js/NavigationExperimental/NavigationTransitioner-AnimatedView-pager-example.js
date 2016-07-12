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
 * <Animated.View /> to build a list of animated scenes that render the
 * navigation state.
 */

import type  {
  NavigationSceneRendererProps,
  NavigationState,
  NavigationTransitionProps,
} from 'NavigationTypeDefinition';

const {
  Component,
  PropTypes,
} = React;

const {
  Animated,
  NavigationExperimental,
  StyleSheet,
  Text,
  View,
} = ReactNative;

const {
  PropTypes: NavigationPropTypes,
  StateUtils: NavigationStateUtils,
  Transitioner: NavigationTransitioner,
  Card: NavigationCard,
} = NavigationExperimental;

const {
  PagerPanResponder: NavigationPagerPanResponder,
  PagerStyleInterpolator: NavigationPagerStyleInterpolator,
} = NavigationCard;

function reducer(state: ?NavigationState, action: any): NavigationState {
  if (!state) {
    return {
      index: 0,
      routes: [
        {key: 'Step 1', color: '#ff0000'},
        {key: 'Step 2', color: '#ff7f00'},
        {key: 'Step 3', color: '#ffff00'},
        {key: 'Step 4', color: '#00ff00'},
        {key: 'Step 5', color: '#0000ff'},
        {key: 'Step 6', color: '#4b0082'},
        {key: 'Step 7', color: '#8f00ff'},
      ],
    };
  }

  switch (action) {
    case 'back':
      return NavigationStateUtils.back(state);
    case 'forward':
      return NavigationStateUtils.forward(state);
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
      <View style={styles.example}>
        <ExampleNavigator
          navigationState={this.state}
          navigate={action => this._navigate(action)}
        />
        <NavigationExampleRow
          text="Exit"
          onPress={() => this._navigate('exit')}
        />
      </View>
    );
  }

  _navigate(action: string): boolean {
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
    return this._navigate('back');
  }
}

class ExampleNavigator extends Component {
  _render: Function;
  _renderScene: Function;
  _back: Function;
  _forward: Function;

  props: {
    navigate: Function,
    navigationState: NavigationState,
  };

  static propTypes: {
    navigationState: NavigationPropTypes.navigationState.isRequired,
    navigate: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this._render = this._render.bind(this);
    this._renderScene = this._renderScene.bind(this);
    this._back = this._back.bind(this);
    this._forward = this._forward.bind(this);
  }

  render(): ReactElement<any> {
    return (
      <NavigationTransitioner
        navigationState={this.props.navigationState}
        render={this._render}
      />
    );
  }

  _render(
    transitionProps: NavigationTransitionProps,
  ): ReactElement<any> {
    const scenes = transitionProps.scenes.map((scene) => {
      const sceneProps = {
        ...transitionProps,
        scene,
      };
      return this._renderScene(sceneProps);
    });
    return (
      <View style={styles.navigator}>
        {scenes}
      </View>
    );
  }

  _renderScene(
    sceneProps: NavigationSceneRendererProps,
  ): ReactElement<any> {
    return (
      <ExampleScene
        {...sceneProps}
        key={sceneProps.scene.key + 'scene'}
        navigate={this.props.navigate}
      />
    );
  }

  _back(): void {
    this.props.navigate('back');
  }

  _forward(): void {
    this.props.navigate('forward');
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

    const panHandlers = NavigationPagerPanResponder.forHorizontal({
      ...this.props,
      onNavigateBack: () => navigate('back'),
      onNavigateForward: () => navigate('forward'),
    });

    const route: any = scene.route;
    const style = [
      styles.scene,
      {backgroundColor: route.color},
      NavigationPagerStyleInterpolator.forHorizontal(this.props),
    ];

    return (
      <Animated.View
        {...panHandlers}
        style={style}>
        <View style={styles.heading}>
          <Text style={styles.headingText}>
            {scene.route.key}
          </Text>
        </View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  example: {
    flex: 1,
  },
  navigator: {
    flex: 1,
  },
  scene: {
    backgroundColor: '#000',
    bottom: 0,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scrollView: {
    flex: 1,
    padding: 50,
  },
  heading: {
    alignItems : 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headingText: {
    color: '#222',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

module.exports = Example;
