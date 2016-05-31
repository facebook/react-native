/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationTypeDefinition
 * @flow
 */
'use strict';

const Animated = require('Animated');

// Object Instances

export type NavigationAnimatedValue = Animated.Value;

// Value  & Structs.

export type NavigationGestureDirection = 'horizontal' | 'vertical';

export type NavigationRoute = {
  key: string,
};

export type NavigationState = {
  index: number,
  routes: Array<NavigationRoute>,
};

export type NavigationAction = any;

export type NavigationLayout = {
  height: NavigationAnimatedValue,
  initHeight: number,
  initWidth: number,
  isMeasured: boolean,
  width: NavigationAnimatedValue,
};

export type NavigationScene = {
  index: number,
  isStale: boolean,
  key: string,
  route: NavigationRoute,
};

export type NavigationSceneRendererProps = {
  // The layout of the containing view of the scenes.
  layout: NavigationLayout,

  // The navigation state of the containing view.
  navigationState: NavigationState,

  // Callback to navigation with an action.
  onNavigate: NavigationActionCaller,

  // The progressive index of the containing view's navigation state.
  position: NavigationAnimatedValue,

  // The value that represents the progress of the transition when navigation
  // state changes from one to another. Its numberic value will range from 0
  // to 1.
  //  progress.__getAnimatedValue() < 1 : transtion is happening.
  //  progress.__getAnimatedValue() == 1 : transtion completes.
  progress: NavigationAnimatedValue,

  // The scene to render.
  scene: NavigationScene,

  // All the scenes of the containing view's.
  scenes: Array<NavigationScene>,
};

export type NavigationPanPanHandlers = {
  onMoveShouldSetResponder: Function,
  onMoveShouldSetResponderCapture: Function,
  onResponderEnd: Function,
  onResponderGrant: Function,
  onResponderMove: Function,
  onResponderReject: Function,
  onResponderRelease: Function,
  onResponderStart: Function,
  onResponderTerminate: Function,
  onResponderTerminationRequest: Function,
  onStartShouldSetResponder: Function,
  onStartShouldSetResponderCapture: Function,
};

export type NavigationTransitionSpec = {
  duration?: number,
  // An easing function from `Easing`.
  easing?: () => any,
};

// Functions.

export type NavigationActionCaller = Function;

export type NavigationAnimationSetter = (
  position: NavigationAnimatedValue,
  newState: NavigationState,
  lastState: NavigationState,
) => void;

export type NavigationRenderer = (
  navigationState: ?NavigationRoute,
  onNavigate: NavigationActionCaller,
) => ReactElement<any>;

export type NavigationReducer = (
  state: ?NavigationRoute,
  action: ?NavigationAction,
) => NavigationRoute;

export type NavigationSceneRenderer = (
  props: NavigationSceneRendererProps,
) => ?ReactElement<any>;

export type NavigationStyleInterpolator = (
  props: NavigationSceneRendererProps,
) => Object;

export type NavigationTransitionConfigurator = () => NavigationTransitionSpec;
