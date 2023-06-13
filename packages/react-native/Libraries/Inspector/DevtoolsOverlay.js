/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {DangerouslyImpreciseStyleProp} from '../StyleSheet/StyleSheet';
import type {PointerEvent} from '../Types/CoreEventTypes';
import type {PressEvent} from '../Types/CoreEventTypes';
import type {HostRef} from './getInspectorDataForViewAtPoint';

import View from '../Components/View/View';
import ReactNativeFeatureFlags from '../ReactNative/ReactNativeFeatureFlags';
import StyleSheet from '../StyleSheet/StyleSheet';
import Dimensions from '../Utilities/Dimensions';
import ElementBox from './ElementBox';
import * as React from 'react';

const {findNodeHandle} = require('../ReactNative/RendererProxy');
const getInspectorDataForInstance = require('./getInspectorDataForInstance');
const getInspectorDataForViewAtPoint = require('./getInspectorDataForViewAtPoint');

const {useEffect, useState, useCallback, useRef} = React;

const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

type InspectedObjectFrame = {
  +height: number,
  +left: number,
  +top: number,
  +width: number,
};
type InspectedObject = {
  frame: InspectedObjectFrame,
  style: ?DangerouslyImpreciseStyleProp,
};

type Props = {
  inspectedView: ?HostRef,
};

export default function DevtoolsOverlay({inspectedView}: Props): React.Node {
  const [inspected, setInspected] = useState<?InspectedObject>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const devToolsAgentRef = useRef(null);

  useEffect(() => {
    let devToolsAgent = null;
    let hideTimeoutId = null;

    function onAgentHideNativeHighlight() {
      // we wait to actually hide in order to avoid flicker
      clearTimeout(hideTimeoutId);
      hideTimeoutId = setTimeout(() => {
        setInspected(null);
      }, 100);
    }

    function onAgentShowNativeHighlight(node: Object) {
      clearTimeout(hideTimeoutId);

      // `canonical.publicInstance` => Fabric
      // `canonical` => Legacy Fabric
      // `node` => Legacy renderer
      const component =
        (node.canonical && node.canonical.publicInstance) ??
        // TODO: remove this check when syncing the new version of the renderer from React to React Native.
        node.canonical ??
        node;
      if (!component || !component.measure) {
        return;
      }

      const inspectorData = getInspectorDataForInstance(node);

      component.measure((x, y, width, height, left, top) => {
        // $FlowFixMe[incompatible-call] InspectorData defines props values as strings, which is incompatible with DangerouslyImpreciseStyleProp
        setInspected({
          frame: {left, top, width, height},
          style: inspectorData?.props?.style,
        });
      });
    }

    function cleanup() {
      const currentAgent = devToolsAgent;
      if (currentAgent != null) {
        currentAgent.removeListener(
          'hideNativeHighlight',
          onAgentHideNativeHighlight,
        );
        currentAgent.removeListener(
          'showNativeHighlight',
          onAgentShowNativeHighlight,
        );
        currentAgent.removeListener('shutdown', cleanup);
        currentAgent.removeListener(
          'startInspectingNative',
          onStartInspectingNative,
        );
        currentAgent.removeListener(
          'stopInspectingNative',
          onStopInspectingNative,
        );
        devToolsAgent = null;
      }
      devToolsAgentRef.current = null;
    }

    function onStartInspectingNative() {
      setIsInspecting(true);
    }

    function onStopInspectingNative() {
      setIsInspecting(false);
    }

    function _attachToDevtools(agent: Object) {
      devToolsAgent = agent;
      devToolsAgentRef.current = agent;
      agent.addListener('hideNativeHighlight', onAgentHideNativeHighlight);
      agent.addListener('showNativeHighlight', onAgentShowNativeHighlight);
      agent.addListener('shutdown', cleanup);
      agent.addListener('startInspectingNative', onStartInspectingNative);
      agent.addListener('stopInspectingNative', onStopInspectingNative);
    }

    hook.on('react-devtools', _attachToDevtools);
    if (hook.reactDevtoolsAgent) {
      _attachToDevtools(hook.reactDevtoolsAgent);
    }
    return () => {
      hook.off('react-devtools', _attachToDevtools);
      cleanup();
    };
  }, []);

  const findViewForLocation = useCallback(
    (x: number, y: number) => {
      const agent = devToolsAgentRef.current;
      if (agent == null) {
        return;
      }

      getInspectorDataForViewAtPoint(inspectedView, x, y, viewData => {
        const {touchedViewTag, closestInstance, frame, props} = viewData;
        if (closestInstance != null || touchedViewTag != null) {
          // We call `selectNode` for both non-fabric(viewTag) and fabric(instance),
          // this makes sure it works for both architectures.
          agent.selectNode(findNodeHandle(touchedViewTag));
          if (closestInstance != null) {
            agent.selectNode(closestInstance);
          }

          // $FlowFixMe[incompatible-call] InspectorData defines props values as strings, which is incompatible with DangerouslyImpreciseStyleProp
          setInspected({
            frame,
            style: props?.style,
          });

          return true;
        }

        return false;
      });
    },
    [inspectedView],
  );

  const stopInspecting = useCallback(() => {
    const agent = devToolsAgentRef.current;
    if (agent == null) {
      return;
    }
    agent.stopInspectingNative(true);
    setIsInspecting(false);
    setInspected(null);
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      findViewForLocation(e.nativeEvent.x, e.nativeEvent.y);
    },
    [findViewForLocation],
  );

  const onResponderMove = useCallback(
    (e: PressEvent) => {
      findViewForLocation(
        e.nativeEvent.touches[0].locationX,
        e.nativeEvent.touches[0].locationY,
      );
    },
    [findViewForLocation],
  );

  const shouldSetResponder = useCallback(
    (e: PressEvent): boolean => {
      onResponderMove(e);
      return true;
    },
    [onResponderMove],
  );

  const highlight = inspected ? (
    <ElementBox frame={inspected.frame} style={inspected.style} />
  ) : null;

  if (isInspecting) {
    const events =
      // Pointer events only work on fabric
      ReactNativeFeatureFlags.shouldEmitW3CPointerEvents()
        ? {
            onPointerMove,
            onPointerDown: onPointerMove,
            onPointerUp: stopInspecting,
          }
        : {
            onStartShouldSetResponder: shouldSetResponder,
            onResponderMove: onResponderMove,
            onResponderRelease: stopInspecting,
          };

    return (
      <View
        nativeID="devToolsInspectorOverlay"
        style={[styles.inspector, {height: Dimensions.get('window').height}]}
        {...events}>
        {highlight}
      </View>
    );
  }

  return highlight;
}

const styles = StyleSheet.create({
  inspector: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
  },
});
