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
const Easing = require('Easing');
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
  NavigationTransitionConfigurator,
} from 'NavigationTypeDefinition';

type Props = {
  applyAnimation: NavigationAnimationSetter,
  navigationState: NavigationParentState,
  onNavigate: NavigationActionCaller,
  renderOverlay: ?NavigationSceneRenderer,
  renderScene: NavigationSceneRenderer,
  configureTransition: NavigationTransitionConfigurator,
  style: any,
};

type State = {
  layout: NavigationLayout,
  position: NavigationAnimatedValue,
  scenes: Array<NavigationScene>,
  transition: NavigationAnimatedValue,
};

const {PropTypes} = React;

const DefaultTransitionSpec = {
  duration: 250,
  easing: Easing.inOut(Easing.ease),
};

function isSceneNotStale(scene: NavigationScene): boolean {
  return !scene.isStale;
}

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

  _onLayout: (event: any) => void;
  _onTransitionEnd: () => void;

  props: Props;
  state: State;

  static propTypes = {
    applyAnimation: PropTypes.func,
    configureTransition: PropTypes.func,
    navigationState: NavigationPropTypes.navigationState.isRequired,
    onNavigate: PropTypes.func.isRequired,
    renderOverlay: PropTypes.func,
    renderScene: PropTypes.func.isRequired,
  };

  static defaultProps = {
    applyAnimation: applyDefaultAnimation,
    configureTransition: () => DefaultTransitionSpec,
  };

  constructor(props: Props, context: any) {
    super(props, context);

    // The initial layout isn't measured. Measured layout will be only available
    // when the component is mounted.
    const layout = {
      height: new Animated.Value(0),
      initHeight: 0,
      initWidth: 0,
      isMeasured: false,
      width: new Animated.Value(0),
    };

    this.state = {
      layout,
      position: new Animated.Value(this.props.navigationState.index),
      scenes: NavigationScenesReducer([], this.props.navigationState),
      transition: new Animated.Value(1),
    };
  }

  componentWillMount(): void {
    this._onLayout = this._onLayout.bind(this);
    this._onTransitionEnd = this._onTransitionEnd.bind(this);
  }

  componentWillReceiveProps(nextProps: Props): void {
    const nextScenes = NavigationScenesReducer(
      this.state.scenes,
      nextProps.navigationState,
      this.props.navigationState
    );

    if (nextScenes === this.state.scenes) {
      return;
    }

    const {
      position,
      transition,
    } = this.state;

    // update scenes.
    this.setState({
      scenes: nextScenes,
    });

    // get the transition spec.
    const transtionSpec = nextProps.configureTransition();
    transition.setValue(0);

    const animations = [
      Animated.timing(
        transition,
        {
          ...transtionSpec,
          toValue: 1,
        },
      ),
    ];

    if (nextProps.navigationState.index !== this.props.navigationState.index) {
      animations.push(
        Animated.timing(
          position,
          {
            ...transtionSpec,
            toValue: nextProps.navigationState.index,
          },
        ),
      );
    }

    // play the transition.
    Animated.parallel(animations).start(this._onTransitionEnd);
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
      transition,
    } = this.state;

    return renderScene({
      layout: this.state.layout,
      navigationState,
      onNavigate,
      position,
      scene,
      scenes,
      transition,
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
        transition,
      } = this.state;

      return renderOverlay({
        layout: this.state.layout,
        navigationState,
        onNavigate,
        position,
        scene: scenes[navigationState.index],
        scenes,
        transition,
      });
    }
    return null;
  }

  _onLayout(event: any): void {
    const {height, width} = event.nativeEvent.layout;

    const layout = {
      ...this.state.layout,
      initHeight: height,
      initWidth: width,
      isMeasured: true,
    };

    layout.height.setValue(height);
    layout.width.setValue(width);

    this.setState({ layout });
  }

  _onTransitionEnd(): void {
    const scenes = this.state.scenes.filter(isSceneNotStale);
    if (scenes.length !== this.state.scenes.length) {
      this.setState({ scenes });
    }
  }
}

const styles = StyleSheet.create({
  scenes: {
    flex: 1,
  },
});

module.exports = NavigationAnimatedView;
