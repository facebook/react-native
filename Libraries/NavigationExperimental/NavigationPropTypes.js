/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationPropTypes
 * @flow
 */
'use strict';

import type  {
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

/**
 * React component PropTypes Definitions. Consider using this as a supplementary
 * measure with `NavigationTypeDefinition`. This helps to capture the propType
 * error at run-time, where as `NavigationTypeDefinition` capture the flow
 * type check errors at build time.
 */

const Animated = require('Animated');
const React = require('React');

const {PropTypes} = React;

/* NavigationAction */
const action =  PropTypes.shape({
  type: PropTypes.string.isRequired,
});

/* NavigationAnimatedValue  */
const animatedValue = PropTypes.instanceOf(Animated.Value);

/* NavigationState  */
const navigationState = PropTypes.shape({
  key: PropTypes.string.isRequired,
});

/* NavigationParentState  */
const navigationParentState = PropTypes.shape({
  index: PropTypes.number.isRequired,
  key: PropTypes.string.isRequired,
  children: PropTypes.arrayOf(navigationState),
});

/* NavigationLayout */
const layout = PropTypes.shape({
  height: animatedValue,
  initHeight: PropTypes.number.isRequired,
  initWidth: PropTypes.number.isRequired,
  width: animatedValue,
});

/* NavigationScene */
const scene = PropTypes.shape({
  index: PropTypes.number.isRequired,
  isStale: PropTypes.bool.isRequired,
  key: PropTypes.string.isRequired,
  navigationState,
});

/* NavigationSceneRendererProps */
const SceneRenderer = {
  layout: layout.isRequired,
  navigationState: navigationParentState.isRequired,
  onNavigate: PropTypes.func.isRequired,
  position: animatedValue.isRequired,
  scene: scene.isRequired,
  scenes: PropTypes.arrayOf(scene).isRequired,
};

/* NavigationPanPanHandlers */
const panHandlers = PropTypes.shape({
  onMoveShouldSetResponder: PropTypes.func.isRequired,
  onMoveShouldSetResponderCapture: PropTypes.func.isRequired,
  onResponderEnd: PropTypes.func.isRequired,
  onResponderGrant: PropTypes.func.isRequired,
  onResponderMove: PropTypes.func.isRequired,
  onResponderReject: PropTypes.func.isRequired,
  onResponderRelease: PropTypes.func.isRequired,
  onResponderStart: PropTypes.func.isRequired,
  onResponderTerminate: PropTypes.func.isRequired,
  onResponderTerminationRequest: PropTypes.func.isRequired,
  onStartShouldSetResponder: PropTypes.func.isRequired,
  onStartShouldSetResponderCapture: PropTypes.func.isRequired,
});

/**
 * Helper function that extracts the props needed for scene renderer.
 */
function extractSceneRendererProps(
  props: NavigationSceneRendererProps,
): NavigationSceneRendererProps {
  return {
    layout: props.layout,
    navigationState: props.navigationState,
    onNavigate: props.onNavigate,
    position: props.position,
    scene: props.scene,
    scenes: props.scenes,
  };
}

module.exports = {
  // helpers
  extractSceneRendererProps,

  // Bundled propTypes.
  SceneRenderer,

  // propTypes
  action,
  navigationParentState,
  navigationState,
  panHandlers,
};
