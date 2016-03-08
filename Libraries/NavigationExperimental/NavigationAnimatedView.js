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
  NavigationLayout,
  NavigationParentState,
  NavigationScene,
  NavigationSceneRenderer,
  NavigationState,
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

  _layout: NavigationLayout;
  _onLayout: (event: any) => void;
  _onProgressChange: (data: {value: number}) => void;
  _positionListener: any;

  props: Props;
  state: State;

  constructor(props: Props, context: any) {
    super(props, context);

    this._layout = {
      initWidth: 0,
      initHeight: 0,
      width: new Animated.Value(0),
      height: new Animated.Value(0),
    };

    this.state = {
      position: new Animated.Value(this.props.navigationState.index),
      scenes: this._reduceScenes([], this.props.navigationState),
    };
  }

  componentWillMount(): void {
    this._onLayout = this._onLayout.bind(this);
    this._onProgressChange = this._onProgressChange.bind(this);
  }

  componentDidMount(): void {
    this._positionListener =
      this.state.position.addListener(this._onProgressChange);
  }

  componentWillReceiveProps(nextProps: Props): void {
    if (nextProps.navigationState !== this.props.navigationState) {
      this.setState({
        scenes: this._reduceScenes(
          this.state.scenes,
          nextProps.navigationState,
          this.props.navigationState
        ),
      });
    }
  }

  componentDidUpdate(lastProps: Props): void {
    if (lastProps.navigationState.index !== this.props.navigationState.index) {
      this.props.setTiming(
        this.state.position,
        this.props.navigationState,
        lastProps.navigationState
      );
    }
  }

  componentWillUnmount(): void {
    this.state.position.removeListener(this._positionListener);
  }

  _onProgressChange(data: Object): void {
    const delta = Math.abs(data.value - this.props.navigationState.index);
    if (delta > Number.EPSILON) {
      return;
    }

    const scenes = this.state.scenes.filter(scene => {
      return !scene.isStale;
    });

    if (scenes.length !== this.state.scenes.length) {
      this.setState({ scenes });
    }
  }

  _reduceScenes(
    scenes: Array<NavigationScene>,
    nextState: NavigationParentState,
    lastState: ?NavigationParentState
  ): Array<NavigationScene> {
    const nextScenes = nextState.children.map((child, index) => {
      return {
        index,
        isStale: false,
        navigationState: child,
      };
    });

    if (lastState) {
      lastState.children.forEach((child: NavigationState, index: number) => {
        if (
          !NavigationStateUtils.get(nextState, child.key) &&
          index !== nextState.index
        ) {
          nextScenes.push({
            index,
            isStale: true,
            navigationState: child,
          });
        }
      });
    }

    return nextScenes.sort(compareScenes);
  }

  render(): ReactElement {
    return (
      <View
        onLayout={this._onLayout}
        style={this.props.style}>
        {this.state.scenes.map(this._renderScene, this)}
        {this._renderOverlay()}
      </View>
    );
  }

  _renderScene(scene: NavigationScene): ?ReactElement {
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
      layout: this._layout,
      navigationState,
      onNavigate,
      position,
      scene,
      scenes,
    });
  }

  _renderOverlay(): ?ReactElement {
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
        layout: this._layout,
        navigationState,
        onNavigate,
        position,
        scene: scenes[navigationState.index],
        scenes,
      });
    }
    return null;
  }

  _onLayout(event: any): void {
    const {height, width} = event.nativeEvent.layout;

    const layout = {
      ...this._layout,
      initHeight: height,
      initWidth: width,
    };

    this._layout = layout;

    layout.height.setValue(height);
    layout.width.setValue(width);
  }
}

NavigationAnimatedView.propTypes = propTypes;
NavigationAnimatedView.defaultProps = defaultProps;

NavigationAnimatedView = NavigationContainer.create(NavigationAnimatedView);

module.exports = NavigationAnimatedView;
