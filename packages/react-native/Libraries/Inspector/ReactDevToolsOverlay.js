/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {InspectedViewRef} from '../ReactNative/AppContainer-dev';
import type {PointerEvent} from '../Types/CoreEventTypes';
import type {PressEvent} from '../Types/CoreEventTypes';
import type {ReactDevToolsAgent} from '../Types/ReactDevToolsTypes';
import type {InspectedElement} from './Inspector';

import View from '../Components/View/View';
import ReactNativeFeatureFlags from '../ReactNative/ReactNativeFeatureFlags';
import StyleSheet from '../StyleSheet/StyleSheet';
import ElementBox from './ElementBox';
import * as React from 'react';

const getInspectorDataForViewAtPoint = require('./getInspectorDataForViewAtPoint');

const {useEffect, useState, useCallback} = React;

type Props = {
  inspectedViewRef: InspectedViewRef,
  reactDevToolsAgent: ReactDevToolsAgent,
};

export default function ReactDevToolsOverlay({
  inspectedViewRef,
  reactDevToolsAgent,
}: Props): React.Node {
  const [inspected, setInspected] = useState<?InspectedElement>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  useEffect(() => {
    function cleanup() {
      reactDevToolsAgent.removeListener('shutdown', cleanup);
      reactDevToolsAgent.removeListener(
        'startInspectingNative',
        onStartInspectingNative,
      );
      reactDevToolsAgent.removeListener(
        'stopInspectingNative',
        onStopInspectingNative,
      );
    }

    function onStartInspectingNative() {
      setIsInspecting(true);
    }

    function onStopInspectingNative() {
      setIsInspecting(false);
    }

    reactDevToolsAgent.addListener('shutdown', cleanup);
    reactDevToolsAgent.addListener(
      'startInspectingNative',
      onStartInspectingNative,
    );
    reactDevToolsAgent.addListener(
      'stopInspectingNative',
      onStopInspectingNative,
    );

    return cleanup;
  }, [reactDevToolsAgent]);

  const findViewForLocation = useCallback(
    (x: number, y: number) => {
      getInspectorDataForViewAtPoint(
        inspectedViewRef.current,
        x,
        y,
        viewData => {
          const {frame, closestPublicInstance} = viewData;

          if (closestPublicInstance == null) {
            return false;
          }

          reactDevToolsAgent.selectNode(closestPublicInstance);
          setInspected({frame});
          return true;
        },
      );
    },
    [inspectedViewRef, reactDevToolsAgent],
  );

  const stopInspecting = useCallback(() => {
    reactDevToolsAgent.stopInspectingNative(true);
    setIsInspecting(false);
    setInspected(null);
  }, [reactDevToolsAgent]);

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

  const highlight = inspected ? <ElementBox frame={inspected.frame} /> : null;

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
        style={styles.inspector}
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
    bottom: 0,
  },
});
