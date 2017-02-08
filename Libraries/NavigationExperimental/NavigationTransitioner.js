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
  NavigationAnimatedValue,
  NavigationLayout,
  NavigationScene,
  NavigationState,
  NavigationTransitionProps,
  NavigationTransitionSpec,
} from 'NavigationTypeDefinition';

type Props = {
  configureTransition: (
    a: NavigationTransitionProps,
    b: ?NavigationTransitionProps,
  ) => NavigationTransitionSpec,
  navigationState: NavigationState,
  onTransitionEnd: () => void,
  onTransitionStart: () => void,
  render: (a: NavigationTransitionProps, b: ?NavigationTransitionProps) => any,
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
  timing: Animated.timing,
};

class NavigationTransitioner extends React.Component<any, Props, State> {
  _onLayout: (event: any) => void;
  _onTransitionEnd: () => void;
  _prevTransitionProps: ?NavigationTransitionProps;
  _transitionProps: NavigationTransitionProps;
  _isMounted: boolean;

  props: Props;
  state: State;

  static propTypes = {
    configureTransition: PropTypes.func,
    navigationState: NavigationPropTypes.navigationState.isRequired,
    onTransitionEnd: PropTypes.func,
    onTransitionStart: PropTypes.func,
    render: PropTypes.func.isRequired,
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

    this._prevTransitionProps = null;
    this._transitionProps = buildTransitionProps(props, this.state);
    this._isMounted = false;
  }

  componentWillMount(): void {
    this._onLayout = this._onLayout.bind(this);
    this._onTransitionEnd = this._onTransitionEnd.bind(this);
  }

  componentDidMount(): void {
    this._isMounted = true;
  }

  componentWillUnmount(): void {
    this._isMounted = false;
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

    const nextState = {
      ...this.state,
      scenes: nextScenes,
    };

    const {
      position,
      progress,
    } = nextState;

    progress.setValue(0);

    this._prevTransitionProps = this._transitionProps;
    this._transitionProps = buildTransitionProps(nextProps, nextState);

    // get the transition spec.
    const transitionUserSpec = nextProps.configureTransition ?
      nextProps.configureTransition(
        this._transitionProps,
        this._prevTransitionProps,
      ) :
      null;

    const transitionSpec = {
      ...DefaultTransitionSpec,
      ...transitionUserSpec,
    };

    const {timing} = transitionSpec;
    delete transitionSpec.timing;

    const animations = [
      timing(
        progress,
        {
          ...transitionSpec,
          toValue: 1,
        },
      ),
    ];

    if (nextProps.navigationState.index !== this.props.navigationState.index) {
      animations.push(
        timing(
          position,
          {
            ...transitionSpec,
            toValue: nextProps.navigationState.index,
          },
        ),
      );
    }

    // update scenes and play the transition
    this.setState(nextState, () => {
      nextProps.onTransitionStart && nextProps.onTransitionStart(
        this._transitionProps,
        this._prevTransitionProps,
      );
      Animated.parallel(animations).start(this._onTransitionEnd);
    });
  }

  render(): React.Element<any> {
    return (
      <View
        onLayout={this._onLayout}
        style={[styles.main, this.props.style]}>
        {this.props.render(this._transitionProps, this._prevTransitionProps)}
      </View>
    );
  }

  _onLayout(event: any): void {
    const {height, width} = event.nativeEvent.layout;
    if (this.state.layout.initWidth === width &&
      this.state.layout.initHeight === height) {
      return;
    }
    const layout = {
      ...this.state.layout,
      initHeight: height,
      initWidth: width,
      isMeasured: true,
    };

    layout.height.setValue(height);
    layout.width.setValue(width);

    const nextState = {
      ...this.state,
      layout,
    };

    this._transitionProps = buildTransitionProps(this.props, nextState);
    this.setState(nextState);
  }

  _onTransitionEnd(): void {
    if (!this._isMounted) {
      return;
    }

    const prevTransitionProps = this._prevTransitionProps;
    this._prevTransitionProps = null;

    const nextState = {
      ...this.state,
      scenes: this.state.scenes.filter(isSceneNotStale),
    };

    this._transitionProps = buildTransitionProps(this.props, nextState);

    this.setState(nextState, () => {
      this.props.onTransitionEnd && this.props.onTransitionEnd(
        this._transitionProps,
        prevTransitionProps,
      );
    });
  }
}

function buildTransitionProps(
  props: Props,
  state: State,
): NavigationTransitionProps {
  const {
    navigationState,
  } = props;

  const {
    layout,
    position,
    progress,
    scenes,
  } = state;

  const scene = scenes.find(isSceneActive);

  invariant(scene, 'No active scene when building navigation transition props.');

  return {
    layout,
    navigationState,
    position,
    progress,
    scenes,
    scene
  };
}

function isSceneNotStale(scene: NavigationScene): boolean {
  return !scene.isStale;
}

function isSceneActive(scene: NavigationScene): boolean {
  return scene.isActive;
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
});

module.exports = NavigationTransitioner;
