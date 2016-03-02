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

var Animated = require('Animated');
var Map = require('Map');
var NavigationStateUtils = require('NavigationStateUtils');
var NavigationContainer = require('NavigationContainer');
var React = require('React');
var View = require('View');

import type {
  NavigationState,
  NavigationParentState,
} from 'NavigationStateUtils';

type NavigationScene = {
  index: number,
  state: NavigationState,
  isStale: boolean,
};

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
  two: NavigationScene
): number {
  if (one.index > two.index) {
    return 1;
  }
  if (one.index < two.index) {
    return -1;
  }

  return compareKey(
    one.state.key,
    two.state.key
  );
}

type Layout = {
  initWidth: number,
  initHeight: number,
  width: Animated.Value;
  height: Animated.Value;
};

type Position = Animated.Value;

/**
 * Definition of the props object that is passed to the functions
 * that render the overlay and the scene.
 */
type NavigationStateRendererProps = {
  // The state of the child view.
  navigationState: NavigationState,
  // The index of the child view.
  index: number,
  // The "progressive index" of the containing navigation state.
  position: Position,
  // The layout of the the containing navigation view.
  layout: Layout,
  // The state of the the containing navigation view.
  navigationParentState: NavigationParentState,

  onNavigate: (action: any) => void,
};

type NavigationStateRenderer = (
  props: NavigationStateRendererProps,
) => ReactElement;

type TimingSetter = (
  position: Animated.Value,
  newState: NavigationParentState,
  lastState: NavigationParentState,
) => void;

type Props = {
  navigationState: NavigationParentState,
  onNavigate: (action: any) => void,
  renderScene: NavigationStateRenderer,
  renderOverlay: ?NavigationStateRenderer,
  style: any,
  setTiming: ?TimingSetter,
};

class NavigationAnimatedView extends React.Component {
  _animatedHeight: Animated.Value;
  _animatedWidth: Animated.Value;
  _lastHeight: number;
  _lastWidth: number;
  props: Props;
  constructor(props) {
    super(props);
    this._lastWidth = 0;
    this._lastHeight = 0;
    this._animatedHeight = new Animated.Value(this._lastHeight);
    this._animatedWidth = new Animated.Value(this._lastWidth);

    this.state = {
      position: new Animated.Value(this.props.navigationState.index),
      scenes: new Map(),
    };
  }
  componentWillMount() {
    this.setState({
      scenes: this._reduceScenes(this.state.scenes, this.props.navigationState),
    });
  }
  componentDidMount() {
    this.postionListener = this.state.position.addListener(this._onProgressChange.bind(this));
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
    if (this.postionListener) {
      this.state.position.removeListener(this.postionListener);
      this.postionListener = null;
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
        state: child,
        isStale: false,
      };
    });

    if (lastState) {
      lastState.children.forEach((child, index) => {
        if (!NavigationStateUtils.get(nextState, child.key) && index !== nextState.index) {
          nextScenes.push({
            index,
            state: child,
            isStale: true,
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
    return this.props.renderScene({
      index: scene.index,
      layout: this._getLayout(),
      navigationParentState: this.props.navigationState,
      navigationState: scene.state,
      onNavigate: this.props.onNavigate,
      position: this.state.position,
    });
  }
  _renderOverlay() {
    const {
      onNavigate,
      renderOverlay,
      navigationState,
    } = this.props;
    if (renderOverlay) {
      return renderOverlay({
        index: navigationState.index,
        layout: this._getLayout(),
        navigationParentState: navigationState,
        navigationState: navigationState.children[navigationState.index],
        onNavigate: onNavigate,
        position: this.state.position,
      });
    }
    return null;
  }
}

function setDefaultTiming(position, navigationState) {
  Animated.spring(
    position,
    {
      bounciness: 0,
      toValue: navigationState.index,
    }
  ).start();
}

NavigationAnimatedView.defaultProps = {
  setTiming: setDefaultTiming,
};

NavigationAnimatedView = NavigationContainer.create(NavigationAnimatedView);

module.exports = NavigationAnimatedView;
