/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Overlay} from './TraceUpdateOverlayNativeComponent';

import UIManager from '../../ReactNative/UIManager';
import processColor from '../../StyleSheet/processColor';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Platform from '../../Utilities/Platform';
import View from '../View/View';
import TraceUpdateOverlayNativeComponent, {
  Commands,
} from './TraceUpdateOverlayNativeComponent';
import * as React from 'react';

type AgentEvents = {
  drawTraceUpdates: [Array<{node: TraceNode, color: string}>],
  disableTraceUpdates: [],
};

interface Agent {
  addListener<Event: $Keys<AgentEvents>>(
    event: Event,
    listener: (...AgentEvents[Event]) => void,
  ): void;
  removeListener(event: $Keys<AgentEvents>, listener: () => void): void;
}

type PublicInstance = {
  measure?: (
    (
      x: number,
      y: number,
      width: number,
      height: number,
      left: number,
      top: number,
    ) => void,
  ) => void,
};

type TraceNode =
  | PublicInstance
  | {
      canonical?:
        | PublicInstance // TODO: remove this variant when syncing the new version of the renderer from React to React Native.
        | {
            publicInstance?: PublicInstance,
          },
    };

type ReactDevToolsGlobalHook = {
  on: (eventName: string, (agent: Agent) => void) => void,
  off: (eventName: string, (agent: Agent) => void) => void,
  reactDevtoolsAgent: Agent,
};

const {useEffect, useRef, useState} = React;
const hook: ReactDevToolsGlobalHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
const isNativeComponentReady =
  Platform.OS === 'android' &&
  UIManager.hasViewManagerConfig('TraceUpdateOverlay');
let devToolsAgent: ?Agent;

export default function TraceUpdateOverlay(): React.Node {
  const [overlayDisabled, setOverlayDisabled] = useState(false);
  // This effect is designed to be explicitly shown here to avoid re-subscribe from the same
  // overlay component.
  useEffect(() => {
    if (!isNativeComponentReady) {
      return;
    }

    function attachToDevtools(agent: Agent) {
      devToolsAgent = agent;
      agent.addListener('drawTraceUpdates', onAgentDrawTraceUpdates);
      agent.addListener('disableTraceUpdates', onAgentDisableTraceUpdates);
    }

    function subscribe() {
      hook?.on('react-devtools', attachToDevtools);
      if (hook?.reactDevtoolsAgent) {
        attachToDevtools(hook.reactDevtoolsAgent);
      }
    }

    function unsubscribe() {
      hook?.off('react-devtools', attachToDevtools);
      const agent = devToolsAgent;
      if (agent != null) {
        agent.removeListener('drawTraceUpdates', onAgentDrawTraceUpdates);
        agent.removeListener('disableTraceUpdates', onAgentDisableTraceUpdates);
        devToolsAgent = null;
      }
    }

    function onAgentDrawTraceUpdates(
      nodesToDraw: Array<{node: TraceNode, color: string}> = [],
    ) {
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
    }

    function onAgentDisableTraceUpdates() {
      // When trace updates are disabled from the backend, we won't receive draw events until it's enabled by the next draw. We can safely remove the overlay as it's not needed now.
      setOverlayDisabled(true);
    }

    subscribe();
    return unsubscribe;
  }, []); // Only run once when the overlay initially rendered

  const nativeComponentRef =
    useRef<?React.ElementRef<typeof TraceUpdateOverlayNativeComponent>>(null);

  return (
    !overlayDisabled &&
    isNativeComponentReady && (
      <View pointerEvents="none" style={styles.overlay}>
        <TraceUpdateOverlayNativeComponent
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
