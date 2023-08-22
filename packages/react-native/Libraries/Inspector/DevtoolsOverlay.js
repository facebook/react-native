/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

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
const getInspectorDataForViewAtPoint = require('./getInspectorDataForViewAtPoint');

const {useEffect, useState, useCallback, useRef} = React;

const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

export default function DevtoolsOverlay({
  inspectedView,
}: {
  inspectedView: ?HostRef,
}): React.Node {
  const [inspected, setInspected] = useState<null | {
    frame: {+height: any, +left: any, +top: any, +width: any},
  }>(null);
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

    function onAgentShowNativeHighlight(node: any) {
      clearTimeout(hideTimeoutId);

      // `publicInstance` => Fabric
      // TODO: remove this check when syncing the new version of the renderer from React to React Native.
      // `canonical` => Legacy Fabric
      // `node` => Legacy renderer
      const component = node.publicInstance ?? node.canonical ?? node;
      if (!component || !component.measure) {
        return;
      }

      component.measure((x, y, width, height, left, top) => {
        setInspected({
          frame: {left, top, width, height},
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
        const {touchedViewTag, closestInstance, frame} = viewData;
        if (closestInstance != null || touchedViewTag != null) {
          // We call `selectNode` for both non-fabric(viewTag) and fabric(instance),
          // this makes sure it works for both architectures.
          agent.selectNode(findNodeHandle(touchedViewTag));
          if (closestInstance != null) {
            agent.selectNode(closestInstance);
          }
          setInspected({
            frame,
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

  let highlight = inspected ? <ElementBox frame={inspected.frame} /> : null;
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
