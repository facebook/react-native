/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Overlay} from '../../Debugging/DebuggingOverlayNativeComponent';
import type {
  InstanceFromReactDevTools,
  ReactDevToolsAgent,
} from '../../Types/ReactDevToolsTypes';

import DebuggingOverlayNativeComponent, {
  Commands,
} from '../../Debugging/DebuggingOverlayNativeComponent';
import UIManager from '../../ReactNative/UIManager';
import processColor from '../../StyleSheet/processColor';
import StyleSheet from '../../StyleSheet/StyleSheet';
import View from '../View/View';
import * as React from 'react';

const {useEffect, useRef, useState} = React;
const isNativeComponentReady =
  UIManager.hasViewManagerConfig('DebuggingOverlay');

type Props = {
  reactDevToolsAgent: ReactDevToolsAgent,
};

export default function TraceUpdateOverlay({
  reactDevToolsAgent,
}: Props): React.Node {
  const [overlayDisabled, setOverlayDisabled] = useState(false);

  useEffect(() => {
    const drawTraceUpdates = (
      nodesToDraw: Array<{node: InstanceFromReactDevTools, color: string}> = [],
    ) => {
      if (!isNativeComponentReady) {
        return;
      }

      // If overlay is disabled before, now it's enabled.
      setOverlayDisabled(false);

      const newFramesToDraw: Array<Promise<Overlay>> = [];
      nodesToDraw.forEach(({node, color}) => {
        // `canonical.publicInstance` => Fabric
        // TODO: remove this check when syncing the new version of the renderer from React to React Native.
        // `canonical` => Legacy Fabric
        // `node` => Legacy renderer
        const component =
          (node.canonical && node.canonical.publicInstance) ??
          node.canonical ??
          node;
        if (!component || !component.measure) {
          return;
        }
        const frameToDrawPromise = new Promise<Overlay>(resolve => {
          // The if statement here is to make flow happy
          if (component.measure) {
            // TODO(T145522797): We should refactor this to use `getBoundingClientRect` when Paper is no longer supported.
            component.measure((x, y, width, height, left, top) => {
              resolve({
                rect: {left, top, width, height},
                color: processColor(color),
              });
            });
          }
        });
        newFramesToDraw.push(frameToDrawPromise);
      });
      Promise.all(newFramesToDraw).then(
        results => {
          if (nativeComponentRef.current != null) {
            Commands.draw(
              nativeComponentRef.current,
              JSON.stringify(
                results.filter(
                  ({rect, color}) => rect.width >= 0 && rect.height >= 0,
                ),
              ),
            );
          }
        },
        err => {
          console.error(`Failed to measure updated traces. Error: ${err}`);
        },
      );
    };

    const disableTraceUpdates = () => {
      // When trace updates are disabled from the backend, we won't receive draw events until it's enabled by the next draw. We can safely remove the overlay as it's not needed now.
      setOverlayDisabled(true);
    };

    reactDevToolsAgent.addListener('drawTraceUpdates', drawTraceUpdates);
    reactDevToolsAgent.addListener('disableTraceUpdates', drawTraceUpdates);

    return () => {
      reactDevToolsAgent.removeListener('drawTraceUpdates', drawTraceUpdates);
      reactDevToolsAgent.removeListener(
        'disableTraceUpdates',
        disableTraceUpdates,
      );
    };
  }, [reactDevToolsAgent]);

  const nativeComponentRef =
    useRef<?React.ElementRef<typeof DebuggingOverlayNativeComponent>>(null);

  return (
    !overlayDisabled &&
    isNativeComponentReady && (
      <View pointerEvents="none" style={styles.overlay}>
        <DebuggingOverlayNativeComponent
          ref={nativeComponentRef}
          style={styles.overlay}
        />
      </View>
    )
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
