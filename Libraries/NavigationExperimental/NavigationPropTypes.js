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

/* NavigationRoute  */
const navigationRoute = PropTypes.shape({
  key: PropTypes.string.isRequired,
});

/* navigationRoute  */
const navigationState = PropTypes.shape({
  index: PropTypes.number.isRequired,
  routes: PropTypes.arrayOf(navigationRoute),
});

/* NavigationLayout */
const layout = PropTypes.shape({
  height: animatedValue,
  initHeight: PropTypes.number.isRequired,
  initWidth: PropTypes.number.isRequired,
  isMeasured: PropTypes.bool.isRequired,
  width: animatedValue,
});

/* NavigationScene */
const scene = PropTypes.shape({
  index: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  isStale: PropTypes.bool.isRequired,
  key: PropTypes.string.isRequired,
  route: navigationRoute.isRequired,
});

/* NavigationSceneRendererProps */
const SceneRendererProps = {
  layout: layout.isRequired,
  navigationState: navigationState.isRequired,
  position: animatedValue.isRequired,
  progress: animatedValue.isRequired,
  scene: scene.isRequired,
  scenes: PropTypes.arrayOf(scene).isRequired,
};

const SceneRenderer = PropTypes.shape(SceneRendererProps);

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
    position: props.position,
    progress: props.progress,
    scene: props.scene,
    scenes: props.scenes,
  };
}

module.exports = {
  // helpers
  extractSceneRendererProps,

  // Bundled propTypes.
  SceneRendererProps,

  // propTypes
  SceneRenderer,
  action,
  navigationState,
  navigationRoute,
  panHandlers,
};
