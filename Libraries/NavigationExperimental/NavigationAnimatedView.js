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
const NavigationScenesReducer = require('NavigationScenesReducer');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

import type {
  NavigationActionCaller,
  NavigationAnimatedValue,
  NavigationAnimationSetter,
  NavigationLayout,
  NavigationParentState,
  NavigationScene,
  NavigationSceneRenderer,
} from 'NavigationTypeDefinition';

type Props = {
  applyAnimation: NavigationAnimationSetter,
  navigationState: NavigationParentState,
  onNavigate: NavigationActionCaller,
  renderOverlay: ?NavigationSceneRenderer,
  renderScene: NavigationSceneRenderer,
  style: any,
};

type State = {
  position: NavigationAnimatedValue,
  scenes: Array<NavigationScene>,
};

const {PropTypes} = React;

function applyDefaultAnimation(
  position: NavigationAnimatedValue,
  navigationState: NavigationParentState,
): void {
  Animated.spring(
    position,
    {
      bounciness: 0,
      toValue: navigationState.index,
    }
  ).start();
}

class NavigationAnimatedView
  extends React.Component<any, Props, State> {

  _layout: NavigationLayout;
  _onLayout: (event: any) => void;
  _onProgressChange: (data: {value: number}) => void;
  _positionListener: any;

  props: Props;
  state: State;

  static propTypes = {
    applyAnimation: PropTypes.func,
    navigationState: NavigationPropTypes.navigationState.isRequired,
    onNavigate: PropTypes.func.isRequired,
    renderOverlay: PropTypes.func,
    renderScene: PropTypes.func.isRequired,
  };

  static defaultProps = {
    applyAnimation: applyDefaultAnimation,
  };

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
      scenes: NavigationScenesReducer([], this.props.navigationState),
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
        scenes: NavigationScenesReducer(
          this.state.scenes,
          nextProps.navigationState,
          this.props.navigationState
        ),
      });
    }
  }

  componentDidUpdate(lastProps: Props): void {
    if (lastProps.navigationState.index !== this.props.navigationState.index) {
      this.props.applyAnimation(
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

  render(): ReactElement {
    const overlay = this._renderOverlay();
    const scenes = this._renderScenes();
    return (
      <View
        onLayout={this._onLayout}
        style={this.props.style}>
        <View style={styles.scenes} key="scenes">
          {scenes}
        </View>
        {overlay}
      </View>
    );
  }

  _renderScenes(): Array<?ReactElement> {
    return this.state.scenes.map(this._renderScene, this);
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

const styles = StyleSheet.create({
  scenes: {
    flex: 1,
  },
});

NavigationAnimatedView = NavigationContainer.create(NavigationAnimatedView);

module.exports = NavigationAnimatedView;
