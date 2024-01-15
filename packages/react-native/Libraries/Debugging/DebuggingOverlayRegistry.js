/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {
  AppContainerRootViewRef,
  DebuggingOverlayRef,
} from '../ReactNative/AppContainer-dev';
import type {NativeMethods} from '../Renderer/shims/ReactNativeTypes';
import type {
  InstanceFromReactDevTools,
  ReactDevToolsAgent,
  ReactDevToolsAgentEvents,
  ReactDevToolsGlobalHook,
} from '../Types/ReactDevToolsTypes';
import type {TraceUpdate} from './DebuggingOverlayNativeComponent';

import {findNodeHandle} from '../ReactNative/RendererProxy';
import processColor from '../StyleSheet/processColor';

// TODO(T171193075): __REACT_DEVTOOLS_GLOBAL_HOOK__ is always injected in dev-bundles,
// but it is not mocked in some Jest tests. We should update Jest tests setup, so it would be the same as expected testing environment.
const reactDevToolsHook: ?ReactDevToolsGlobalHook =
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

export type DebuggingOverlayRegistrySubscriberProtocol = {
  rootViewRef: AppContainerRootViewRef,
  debuggingOverlayRef: DebuggingOverlayRef,
};

class DebuggingOverlayRegistry {
  #registry: Set<DebuggingOverlayRegistrySubscriberProtocol> = new Set();
  #reactDevToolsAgent: ReactDevToolsAgent | null = null;

  constructor() {
    if (reactDevToolsHook?.reactDevtoolsAgent != null) {
      this.#onReactDevToolsAgentAttached(reactDevToolsHook.reactDevtoolsAgent);
      return;
    }

    reactDevToolsHook?.on?.(
      'react-devtools',
      this.#onReactDevToolsAgentAttached,
    );
  }

  subscribe(subscriber: DebuggingOverlayRegistrySubscriberProtocol) {
    this.#registry.add(subscriber);
  }

  unsubscribe(subscriber: DebuggingOverlayRegistrySubscriberProtocol) {
    const wasPresent = this.#registry.delete(subscriber);
    if (!wasPresent) {
      console.error(
        '[DebuggingOverlayRegistry] Unexpected argument for unsubscription, which was not previously subscribed:',
        subscriber,
      );
    }
  }

  #onReactDevToolsAgentAttached = (agent: ReactDevToolsAgent): void => {
    this.#reactDevToolsAgent = agent;

    agent.addListener('drawTraceUpdates', this.#onDrawTraceUpdates);
    agent.addListener('showNativeHighlight', this.#onHighlightElements);
    agent.addListener('hideNativeHighlight', this.#onClearElementsHighlights);
  };

  #getPublicInstanceFromInstance(
    instanceHandle: InstanceFromReactDevTools,
  ): NativeMethods | null {
    // `canonical.publicInstance` => Fabric
    if (instanceHandle.canonical?.publicInstance != null) {
      return instanceHandle.canonical?.publicInstance;
    }

    // `canonical` => Legacy Fabric
    if (instanceHandle.canonical != null) {
      // $FlowFixMe[incompatible-return]
      return instanceHandle.canonical;
    }

    // `instanceHandle` => Legacy renderer
    if (instanceHandle.measure != null) {
      // $FlowFixMe[incompatible-return]
      return instanceHandle;
    }

    return null;
  }

  #onDrawTraceUpdates: (
    ...ReactDevToolsAgentEvents['drawTraceUpdates']
  ) => void = traceUpdates => {
    const promisesToResolve: Array<Promise<TraceUpdate>> = [];

    traceUpdates.forEach(({node, color}) => {
      const publicInstance = this.#getPublicInstanceFromInstance(node);

      if (publicInstance == null) {
        return;
      }

      const frameToDrawPromise = new Promise<TraceUpdate>((resolve, reject) => {
        // TODO(T171095283): We should refactor this to use `getBoundingClientRect` when Paper is no longer supported.
        publicInstance.measure((x, y, width, height, left, top) => {
          const id = findNodeHandle(node);
          if (id == null) {
            reject();
            return;
          }

          resolve({
            id,
            rectangle: {x: left, y: top, width, height},
            color: processColor(color),
          });
        });
      });

      promisesToResolve.push(frameToDrawPromise);
    });

    Promise.all(promisesToResolve).then(
      updates => {
        for (const subscriber of this.#registry) {
          subscriber.debuggingOverlayRef.current?.highlightTraceUpdates(
            updates,
          );
        }
      },
      err => {
        console.error(`Failed to measure updated traces. Error: ${err}`);
      },
    );
  };

  #onHighlightElements: (
    ...ReactDevToolsAgentEvents['showNativeHighlight']
  ) => void = node => {
    // First clear highlights for every container
    for (const subscriber of this.#registry) {
      subscriber.debuggingOverlayRef.current?.clearElementsHighlight();
    }

    const publicInstance = this.#getPublicInstanceFromInstance(node);
    if (publicInstance == null) {
      return;
    }

    publicInstance.measure((x, y, width, height, left, top) => {
      for (const subscriber of this.#registry) {
        subscriber.debuggingOverlayRef.current?.highlightElements([
          {x: left, y: top, width, height},
        ]);
      }
    });
  };

  #onClearElementsHighlights: (
    ...ReactDevToolsAgentEvents['hideNativeHighlight']
  ) => void = () => {
    for (const subscriber of this.#registry) {
      subscriber.debuggingOverlayRef.current?.clearElementsHighlight();
    }
  };
}

const debuggingOverlayRegistryInstance: DebuggingOverlayRegistry =
  new DebuggingOverlayRegistry();
export default debuggingOverlayRegistryInstance;
