/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationTransitioner
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

const invariant = require('fbjs/lib/invariant');

import type {
  NavigationActionCaller,
  NavigationAnimatedValue,
  NavigationLayout,
  NavigationState,
  NavigationScene,
  NavigationSceneRenderer,
  NavigationTransitionConfigurator,
} from 'NavigationTypeDefinition';

type Props = {
  configureTransition: NavigationTransitionConfigurator,
  navigationState: NavigationState,
  onNavigate: NavigationActionCaller,
  onTransitionEnd: () => void,
  onTransitionStart: () => void,
  renderOverlay: ?NavigationSceneRenderer,
  renderScene: NavigationSceneRenderer,
  style: any,
};

type State = {
  layout: NavigationLayout,
  position: NavigationAnimatedValue,
  progress: NavigationAnimatedValue,
  scenes: Array<NavigationScene>,
};

const {PropTypes} = React;

const DefaultTransitionSpec = {
  duration: 250,
  easing: Easing.inOut(Easing.ease),
};

function isSceneNotStale(scene: NavigationScene): boolean {
  return !scene.isStale;
}

class NavigationTransitioner extends React.Component<any, Props, State> {

  _onLayout: (event: any) => void;
  _onTransitionEnd: () => void;

  props: Props;
  state: State;

  static propTypes = {
    configureTransition: PropTypes.func,
    navigationState: NavigationPropTypes.navigationState.isRequired,
    onNavigate: PropTypes.func.isRequired,
    onTransitionEnd: PropTypes.func,
    onTransitionStart: PropTypes.func,
    renderOverlay: PropTypes.func,
    renderScene: PropTypes.func.isRequired,
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
      progress: new Animated.Value(1),
      scenes: NavigationScenesReducer([], this.props.navigationState),
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
      progress,
    } = this.state;

    // update scenes.
    this.setState({
      scenes: nextScenes,
    });

    // get the transition spec.
    const transitionUserSpec = nextProps.configureTransition ?
      nextProps.configureTransition() :
      null;

    const transitionSpec = {
      ...DefaultTransitionSpec,
      ...transitionUserSpec,
    };

    progress.setValue(0);

    const animations = [
      Animated.timing(
        progress,
        {
          ...transitionSpec,
          toValue: 1,
        },
      ),
    ];

    if (nextProps.navigationState.index !== this.props.navigationState.index) {
      animations.push(
        Animated.timing(
          position,
          {
            ...transitionSpec,
            toValue: nextProps.navigationState.index,
          },
        ),
      );
    }

    // play the transition.
    nextProps.onTransitionStart && nextProps.onTransitionStart();
    Animated.parallel(animations).start(this._onTransitionEnd);
  }

  render(): ReactElement<any> {
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

  _renderScenes(): Array<?ReactElement<any>> {
    return this.state.scenes.map(this._renderScene, this);
  }

  _renderScene(scene: NavigationScene): ?ReactElement<any> {
    const {
      navigationState,
      onNavigate,
      renderScene,
    } = this.props;

    const {
      position,
      progress,
      scenes,
    } = this.state;

    return renderScene({
      layout: this.state.layout,
      navigationState,
      onNavigate,
      position,
      progress,
      scene,
      scenes,
    });
  }

  _renderOverlay(): ?ReactElement<any> {
    if (this.props.renderOverlay) {
      const {
        navigationState,
        onNavigate,
        renderOverlay,
      } = this.props;

      const {
        position,
        progress,
        scenes,
      } = this.state;

      const route = navigationState.routes[navigationState.index];

      const activeScene = scenes.find(scene => {
        return (!scene.isStale && scene.route === route) ?
          scene :
          undefined;
      });

      invariant(!!activeScene, 'no active scene found');

      return renderOverlay({
        layout: this.state.layout,
        navigationState,
        onNavigate,
        position,
        progress,
        scene: activeScene,
        scenes,
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
    this.props.onTransitionEnd && this.props.onTransitionEnd();
  }
}

const styles = StyleSheet.create({
  scenes: {
    flex: 1,
  },
});

module.exports = NavigationTransitioner;
