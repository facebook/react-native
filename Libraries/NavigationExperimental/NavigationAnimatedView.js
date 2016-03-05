/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationAnimatedView
 * @flow
 */
'use strict';

const Animated = require('Animated');
const NavigationContainer = require('NavigationContainer');
const NavigationPropTypes = require('NavigationPropTypes');
const NavigationStateUtils = require('NavigationStateUtils');
const React = require('react-native');
const View = require('View');

import type {
  NavigationAnimatedValue,
  NavigationAnimationSetter,
  NavigationParentState,
  NavigationScene,
  NavigationSceneRenderer,
} from 'NavigationTypeDefinition';

/**
 * Helper function to compare route keys (e.g. "9", "11").
 */
function compareKey(one: string, two: string): number {
  var delta = one.length - two.length;
  if (delta > 0) {
    return 1;
  }
  if (delta < 0) {
    return -1;
  }
  return one > two ? 1 : -1;
}

/**
 * Helper function to sort scenes based on their index and view key.
 */
function compareScenes(
  one: NavigationScene,
  two: NavigationScene,
): number {
  if (one.index > two.index) {
    return 1;
  }
  if (one.index < two.index) {
    return -1;
  }

  return compareKey(
    one.navigationState.key,
    two.navigationState.key,
  );
}

type Props = {
  navigationState: NavigationParentState,
  onNavigate: (action: any) => void,
  renderScene: NavigationSceneRenderer,
  renderOverlay: ?NavigationSceneRenderer,
  style: any,
  setTiming: NavigationAnimationSetter,
};

type State = {
  position: NavigationAnimatedValue,
  scenes: Array<NavigationScene>,
};

const {PropTypes} = React;

const propTypes = {
  navigationState: NavigationPropTypes.navigationState.isRequired,
  onNavigate: PropTypes.func.isRequired,
  renderScene: PropTypes.func.isRequired,
  renderOverlay: PropTypes.func,
  setTiming: PropTypes.func,
};

const defaultProps = {
  setTiming: (
    position: NavigationAnimatedValue,
    navigationState: NavigationParentState,
  ) => {
    Animated.spring(
      position,
      {
        bounciness: 0,
        toValue: navigationState.index,
      }
    ).start();
  },
};

class NavigationAnimatedView
  extends React.Component<any, Props, State> {

  _animatedHeight: Animated.Value;
  _animatedWidth: Animated.Value;
  _lastHeight: number;
  _lastWidth: number;
  _positionListener: any;

  props: Props;
  state: State;

  constructor(props) {
    super(props);
    this._lastWidth = 0;
    this._lastHeight = 0;
    this._animatedHeight = new Animated.Value(this._lastHeight);
    this._animatedWidth = new Animated.Value(this._lastWidth);

    this.state = {
      position: new Animated.Value(this.props.navigationState.index),
      scenes: [],
    };
  }
  componentWillMount() {
    this.setState({
      scenes: this._reduceScenes(this.state.scenes, this.props.navigationState),
    });
  }
  componentDidMount() {
    this._positionListener = this.state.position.addListener(this._onProgressChange.bind(this));
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.navigationState !== this.props.navigationState) {
      this.setState({
        scenes: this._reduceScenes(this.state.scenes, nextProps.navigationState, this.props.navigationState),
      });
    }
  }
  componentDidUpdate(lastProps) {
    if (lastProps.navigationState.index !== this.props.navigationState.index && this.props.setTiming) {
      this.props.setTiming(this.state.position, this.props.navigationState, lastProps.navigationState);
    }
  }
  componentWillUnmount() {
    if (this._positionListener) {
      this.state.position.removeListener(this._positionListener);
      this._positionListener = null;
    }
  }
  _onProgressChange(data: Object): void {
    if (Math.abs(data.value - this.props.navigationState.index) > Number.EPSILON) {
      return;
    }
    this.state.scenes.forEach((scene, index) => {
      if (scene.isStale) {
        const scenes = this.state.scenes.slice();
        scenes.splice(index, 1);
        this.setState({ scenes, });
      }
    });
  }
  _reduceScenes(
    scenes: Array<NavigationScene>,
    nextState: NavigationParentState,
    lastState: ?NavigationParentState
  ): Array<NavigationScene> {
    let nextScenes = nextState.children.map((child, index) => {
      return {
        index,
        isStale: false,
        navigationState: child,
      };
    });

    if (lastState) {
      lastState.children.forEach((child, index) => {
        if (!NavigationStateUtils.get(nextState, child.key) && index !== nextState.index) {
          nextScenes.push({
            index,
            isStale: true,
            navigationState: child,
          });
        }
      });
    }

    nextScenes = nextScenes.sort(compareScenes);

    return nextScenes;
  }
  render() {
    return (
      <View
        onLayout={(e) => {
          const {height, width} = e.nativeEvent.layout;
          this._animatedHeight &&
            this._animatedHeight.setValue(height);
          this._animatedWidth &&
            this._animatedWidth.setValue(width);
          this._lastHeight = height;
          this._lastWidth = width;
        }}
        style={this.props.style}>
        {this.state.scenes.map(this._renderScene, this)}
        {this._renderOverlay()}
      </View>
    );
  }
  _getLayout() {
    return {
      height: this._animatedHeight,
      width: this._animatedWidth,
      initWidth: this._lastWidth,
      initHeight: this._lastHeight,
    };
  }

  _renderScene(scene: NavigationScene) {
    const {
      navigationState,
      onNavigate,
      renderScene,
    } = this.props;

    const {
      position,
      scenes,
    } = this.state;

    return renderScene({
      layout: this._getLayout(),
      navigationState,
      onNavigate,
      position,
      scene,
      scenes,
    });
  }

  _renderOverlay() {
    if (this.props.renderOverlay) {
      const {
        navigationState,
        onNavigate,
        renderOverlay,
      } = this.props;

      const {
        position,
        scenes,
      } = this.state;

      return renderOverlay({
        layout: this._getLayout(),
        navigationState,
        onNavigate,
        position,
        scene: scenes[navigationState.index],
        scenes,
      });
    }
    return null;
  }
}

NavigationAnimatedView.propTypes = propTypes;
NavigationAnimatedView.defaultProps = defaultProps;

NavigationAnimatedView = NavigationContainer.create(NavigationAnimatedView);

module.exports = NavigationAnimatedView;
